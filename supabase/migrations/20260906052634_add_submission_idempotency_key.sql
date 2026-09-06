alter table public.submissions
  add column if not exists client_request_id uuid;

create unique index if not exists submissions_client_request_id_key
  on public.submissions (client_request_id)
  where client_request_id is not null;

create or replace function public.submit_pull(
  p_serial_id bigint,
  p_photo_url text,
  p_country text default null,
  p_source_url text default null,
  p_notes text default null,
  p_submitter_email text default null,
  p_client_request_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_submission_id bigint;
  v_serial_status text;
  v_set_status text;
  v_country text := nullif(btrim(p_country), '');
  v_source_url text := nullif(btrim(p_source_url), '');
  v_notes text := nullif(btrim(p_notes), '');
  v_email text := nullif(lower(btrim(p_submitter_email)), '');
begin
  if p_client_request_id is null then
    raise exception 'Submission request ID is required';
  end if;

  select id into v_submission_id
  from public.submissions
  where client_request_id = p_client_request_id;

  if v_submission_id is not null then
    return v_submission_id;
  end if;

  select serials.status, card_sets.status
  into v_serial_status, v_set_status
  from public.serials
  join public.cards on cards.id = serials.card_id
  join public.card_sets on card_sets.id = cards.set_id
  where serials.id = p_serial_id;

  if v_serial_status is null then
    raise exception 'Serial not found';
  end if;

  if v_set_status <> 'live' then
    raise exception 'This set is not open for submissions yet';
  end if;

  if p_photo_url is null
     or p_photo_url !~ '^submissions/[A-Za-z0-9._-]+$'
     or not exists (
       select 1 from storage.objects
       where bucket_id = 'submission-evidence' and name = p_photo_url
     ) then
    raise exception 'Valid uploaded photo evidence is required';
  end if;

  if v_country is not null and char_length(v_country) > 100 then
    raise exception 'Country is too long';
  end if;

  if v_source_url is not null and
     (char_length(v_source_url) > 2048 or v_source_url !~* '^https?://') then
    raise exception 'Source link must be a valid HTTP or HTTPS URL';
  end if;

  if v_notes is not null and char_length(v_notes) > 5000 then
    raise exception 'Notes are too long';
  end if;

  if v_email is not null and (
    char_length(v_email) > 320
    or v_email !~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$'
  ) then
    raise exception 'Email address is invalid';
  end if;

  if v_serial_status = 'confirmed' and v_email is null then
    raise exception 'Email is required when challenging a confirmed serial';
  end if;

  insert into public.submissions (
    serial_id, photo_url, country, source_url, notes, submitter_email,
    status, client_request_id
  )
  values (
    p_serial_id, p_photo_url, v_country, v_source_url, v_notes, v_email,
    'pending', p_client_request_id
  )
  on conflict (client_request_id) where client_request_id is not null
  do nothing
  returning id into v_submission_id;

  if v_submission_id is null then
    select id into v_submission_id
    from public.submissions
    where client_request_id = p_client_request_id;
  end if;

  return v_submission_id;
end;
$function$;

revoke all on function public.submit_pull(bigint, text, text, text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.submit_pull(bigint, text, text, text, text, text, uuid)
  to service_role;
