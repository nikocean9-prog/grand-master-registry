create or replace function public.reserve_submission_slot(p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_allowed boolean := false;
begin
  if p_ip_hash is null or char_length(p_ip_hash) <> 64 then
    return false;
  end if;

  delete from public.submission_rate_limits
  where window_start < now() - interval '7 days';

  insert into public.submission_rate_limits (
    ip_hash,
    window_start,
    submission_count,
    updated_at
  )
  values (p_ip_hash, now(), 1, now())
  on conflict (ip_hash) do update
  set
    window_start = case
      when public.submission_rate_limits.window_start <= now() - interval '1 hour'
        then now()
      else public.submission_rate_limits.window_start
    end,
    submission_count = case
      when public.submission_rate_limits.window_start <= now() - interval '1 hour'
        then 1
      else public.submission_rate_limits.submission_count + 1
    end,
    updated_at = now()
  where public.submission_rate_limits.window_start <= now() - interval '1 hour'
     or public.submission_rate_limits.submission_count < 5
  returning true into v_allowed;

  return coalesce(v_allowed, false);
end;
$function$;
