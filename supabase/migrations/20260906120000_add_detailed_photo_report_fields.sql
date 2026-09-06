alter table public.submissions
  add column if not exists ai_card_name_read text,
  add column if not exists ai_name_match boolean,
  add column if not exists ai_name_confidence integer,
  add column if not exists ai_serial_confidence integer,
  add column if not exists ai_thumbnail_match boolean,
  add column if not exists ai_thumbnail_confidence integer,
  add column if not exists ai_edit_confidence integer,
  add column if not exists ai_edit_indicators jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'submissions_ai_name_confidence_range') then
    alter table public.submissions add constraint submissions_ai_name_confidence_range check (ai_name_confidence between 0 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'submissions_ai_serial_confidence_range') then
    alter table public.submissions add constraint submissions_ai_serial_confidence_range check (ai_serial_confidence between 0 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'submissions_ai_thumbnail_confidence_range') then
    alter table public.submissions add constraint submissions_ai_thumbnail_confidence_range check (ai_thumbnail_confidence between 0 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'submissions_ai_edit_confidence_range') then
    alter table public.submissions add constraint submissions_ai_edit_confidence_range check (ai_edit_confidence between 0 and 100);
  end if;
end $$;