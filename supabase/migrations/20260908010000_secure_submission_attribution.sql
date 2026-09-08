create or replace function public.classify_submission_origin()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.photo_url like 'bulk/%' then
    new.submission_origin := 'owner_bulk';
  elsif new.public_status_token_hash is not null
        and new.submission_origin = 'unknown' then
    new.submission_origin := 'public_web';
  end if;
  return new;
end;
$$;

drop trigger if exists classify_submission_origin_trigger on public.submissions;
create trigger classify_submission_origin_trigger
before insert or update of photo_url, public_status_token_hash
on public.submissions
for each row execute function public.classify_submission_origin();

revoke all on function public.classify_submission_origin() from public, anon, authenticated;

create or replace function public.attach_submission_attribution(
  p_submission_id bigint,
  p_receipt text,
  p_uploader_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_origin text := 'public_web';
begin
  if p_submission_id < 1
     or char_length(coalesce(p_receipt, '')) < 20
     or p_uploader_hash !~ '^[a-f0-9]{64}$' then
    return false;
  end if;

  if (select auth.uid()) is not null
     and (select auth.jwt() ->> 'aal') = 'aal2'
     and exists (
       select 1 from public.admins
       where user_id = (select auth.uid()) and is_owner = true
     ) then
    v_origin := 'owner_direct';
  end if;

  update public.submissions
  set uploader_hash = p_uploader_hash,
      submission_origin = v_origin
  where id = p_submission_id
    and public_status_token_hash = encode(extensions.digest(p_receipt, 'sha256'), 'hex')
    and (uploader_hash is null or uploader_hash = p_uploader_hash);

  return found;
end;
$$;

revoke all on function public.attach_submission_attribution(bigint, text, text) from public;
grant execute on function public.attach_submission_attribution(bigint, text, text) to anon, authenticated;

update public.submissions
set submission_origin = 'owner_bulk'
where photo_url like 'bulk/%' and submission_origin = 'unknown';
