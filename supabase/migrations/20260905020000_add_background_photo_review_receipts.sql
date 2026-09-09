alter table public.submissions
add column if not exists public_status_token_hash text;

create unique index if not exists submissions_public_status_token_hash_idx
on public.submissions (public_status_token_hash)
where public_status_token_hash is not null;

alter table public.submissions
drop constraint if exists submissions_public_status_token_hash_format;

alter table public.submissions
add constraint submissions_public_status_token_hash_format
check (
  public_status_token_hash is null
  or public_status_token_hash ~ '^[a-f0-9]{64}$'
);
