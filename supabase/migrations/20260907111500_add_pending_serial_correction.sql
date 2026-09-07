create or replace function public.change_pending_submission_serial(
  p_submission_id bigint,
  p_serial_number integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_serial_id bigint;
  v_new_serial_id bigint;
  v_card_id bigint;
  v_region text;
begin
  if auth.uid() is null or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then
    raise exception 'Multi-factor authentication required';
  end if;

  if not exists (
    select 1 from public.admins where user_id = auth.uid()
  ) then
    raise exception 'Not authorised';
  end if;

  if p_serial_number is null or p_serial_number < 1 then
    raise exception 'Invalid serial number';
  end if;

  select s.serial_id, sr.card_id, sr.region
  into v_old_serial_id, v_card_id, v_region
  from public.submissions s
  join public.serials sr on sr.id = s.serial_id
  where s.id = p_submission_id
    and s.status = 'pending'
  for update of s;

  if v_old_serial_id is null then
    raise exception 'Pending submission not found';
  end if;

  select id into v_new_serial_id
  from public.serials
  where card_id = v_card_id
    and region = v_region
    and serial_number = p_serial_number;

  if v_new_serial_id is null then
    raise exception 'That serial number is not available for this card and region';
  end if;

  if v_new_serial_id = v_old_serial_id then
    return;
  end if;

  update public.submissions
  set serial_id = v_new_serial_id
  where id = p_submission_id;

  update public.serials
  set status = 'reported'
  where id = v_new_serial_id
    and status = 'unreported';

  update public.serials old_serial
  set status = 'unreported', confirmed_at = null
  where old_serial.id = v_old_serial_id
    and old_serial.status = 'reported'
    and not exists (
      select 1 from public.submissions other
      where other.serial_id = v_old_serial_id
        and other.status in ('pending', 'approved')
    );
end;
$$;

revoke all on function public.change_pending_submission_serial(bigint, integer) from public;
revoke all on function public.change_pending_submission_serial(bigint, integer) from anon;
grant execute on function public.change_pending_submission_serial(bigint, integer) to authenticated;
