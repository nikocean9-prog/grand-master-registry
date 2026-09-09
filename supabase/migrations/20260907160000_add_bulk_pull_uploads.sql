create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create table public.bulk_upload_batches (
  id uuid primary key default extensions.gen_random_uuid(),
  uploaded_by uuid not null references auth.users(id),
  status text not null default 'uploading'
    check (status in ('uploading', 'queued', 'processing', 'completed', 'completed_with_issues')),
  total_items integer not null default 0 check (total_items >= 0),
  processed_items integer not null default 0 check (processed_items >= 0),
  ready_items integer not null default 0 check (ready_items >= 0),
  review_items integer not null default 0 check (review_items >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.bulk_upload_items (
  id uuid primary key default extensions.gen_random_uuid(),
  batch_id uuid not null references public.bulk_upload_batches(id) on delete cascade,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'ready', 'needs_review', 'error')),
  attempts integer not null default 0 check (attempts between 0 and 5),
  detected_card_id bigint references public.cards(id),
  detected_serial_number integer,
  detected_region text check (detected_region in ('AMERICAS', 'E')),
  confidence integer check (confidence between 0 and 100),
  assessment jsonb,
  submission_id bigint references public.submissions(id),
  error_message text,
  created_at timestamptz not null default now(),
  processing_started_at timestamptz,
  processed_at timestamptz
);

create index bulk_upload_items_queue_idx
  on public.bulk_upload_items (status, created_at)
  where status = 'queued';
create index bulk_upload_items_batch_idx
  on public.bulk_upload_items (batch_id, created_at);

alter table public.bulk_upload_batches enable row level security;
alter table public.bulk_upload_items enable row level security;

revoke all on public.bulk_upload_batches from anon, authenticated;
revoke all on public.bulk_upload_items from anon, authenticated;
grant select, insert, update on public.bulk_upload_batches to authenticated;
grant select, insert on public.bulk_upload_items to authenticated;

create policy "Owners can manage bulk upload batches"
on public.bulk_upload_batches for all to authenticated
using (
  uploaded_by = (select auth.uid())
  and (select auth.jwt() ->> 'aal') = 'aal2'
  and exists (
    select 1 from public.admins
    where admins.user_id = (select auth.uid()) and admins.is_owner = true
  )
)
with check (
  uploaded_by = (select auth.uid())
  and (select auth.jwt() ->> 'aal') = 'aal2'
  and exists (
    select 1 from public.admins
    where admins.user_id = (select auth.uid()) and admins.is_owner = true
  )
);

create policy "Owners can view bulk upload items"
on public.bulk_upload_items for select to authenticated
using (
  (select auth.jwt() ->> 'aal') = 'aal2'
  and exists (
    select 1
    from public.bulk_upload_batches batch
    join public.admins on admins.user_id = batch.uploaded_by
    where batch.id = bulk_upload_items.batch_id
      and batch.uploaded_by = (select auth.uid())
      and admins.is_owner = true
  )
);

create policy "Owners can add bulk upload items"
on public.bulk_upload_items for insert to authenticated
with check (
  status = 'queued'
  and submission_id is null
  and (select auth.jwt() ->> 'aal') = 'aal2'
  and exists (
    select 1
    from public.bulk_upload_batches batch
    join public.admins on admins.user_id = batch.uploaded_by
    where batch.id = bulk_upload_items.batch_id
      and batch.uploaded_by = (select auth.uid())
      and admins.is_owner = true
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bulk-submission-evidence',
  'bulk-submission-evidence',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Owners can upload bulk evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'bulk-submission-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select auth.jwt() ->> 'aal') = 'aal2'
  and exists (
    select 1 from public.admins
    where admins.user_id = (select auth.uid()) and admins.is_owner = true
  )
);

create policy "Owners can view bulk evidence"
on storage.objects for select to authenticated
using (
  bucket_id = 'bulk-submission-evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (select auth.jwt() ->> 'aal') = 'aal2'
  and exists (
    select 1 from public.admins
    where admins.user_id = (select auth.uid()) and admins.is_owner = true
  )
);

do $$
begin
  if not exists (
    select 1 from vault.decrypted_secrets where name = 'bulk_processor_secret'
  ) then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'bulk_processor_secret',
      'Authenticates scheduled bulk pull processing'
    );
  end if;
end;
$$;

create or replace function public.verify_bulk_processor_secret(p_secret text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'bulk_processor_secret'
      and decrypted_secret = p_secret
  );
$$;

revoke all on function public.verify_bulk_processor_secret(text) from public, anon, authenticated;
grant execute on function public.verify_bulk_processor_secret(text) to service_role;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job where jobname = 'bulk-pull-processor'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'bulk-pull-processor',
  '* * * * *',
  $$select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/process-bulk-pulls',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-bulk-processor-secret',
      (select decrypted_secret from vault.decrypted_secrets where name = 'bulk_processor_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );$$
);
