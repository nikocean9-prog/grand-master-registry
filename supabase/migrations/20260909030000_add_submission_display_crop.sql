alter table public.submissions
add column if not exists display_crop jsonb;

comment on column public.submissions.display_crop is
  'Non-destructive normalized card-corner coordinates used only for public display.';

alter table public.submissions
drop constraint if exists submissions_display_crop_valid;

alter table public.submissions
add constraint submissions_display_crop_valid check (
  display_crop is null
  or (
    jsonb_typeof(display_crop) = 'object'
    and (display_crop ->> 'version')::integer = 1
    and (display_crop ->> 'safety')::numeric between 0.02 and 0.03
    and jsonb_typeof(display_crop -> 'corners') = 'array'
    and jsonb_array_length(display_crop -> 'corners') = 4
    and (display_crop -> 'corners' -> 0 ->> 'x')::numeric between 0 and 1
    and (display_crop -> 'corners' -> 0 ->> 'y')::numeric between 0 and 1
    and (display_crop -> 'corners' -> 1 ->> 'x')::numeric between 0 and 1
    and (display_crop -> 'corners' -> 1 ->> 'y')::numeric between 0 and 1
    and (display_crop -> 'corners' -> 2 ->> 'x')::numeric between 0 and 1
    and (display_crop -> 'corners' -> 2 ->> 'y')::numeric between 0 and 1
    and (display_crop -> 'corners' -> 3 ->> 'x')::numeric between 0 and 1
    and (display_crop -> 'corners' -> 3 ->> 'y')::numeric between 0 and 1
  )
);

grant select (display_crop) on public.submissions to anon;

create or replace function public.save_submission_display_crop(
  p_submission_id bigint,
  p_display_crop jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then
    raise exception 'Multi-factor authentication required';
  end if;

  if not exists (
    select 1 from public.admins where user_id = auth.uid()
  ) then
    raise exception 'Not authorised';
  end if;

  update public.submissions
  set display_crop = p_display_crop
  where id = p_submission_id;

  if not found then
    raise exception 'Submission not found';
  end if;
end;
$$;

revoke all on function public.save_submission_display_crop(bigint, jsonb) from public;
revoke all on function public.save_submission_display_crop(bigint, jsonb) from anon;
grant execute on function public.save_submission_display_crop(bigint, jsonb) to authenticated;
