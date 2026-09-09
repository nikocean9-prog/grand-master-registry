alter table public.submissions
drop constraint if exists submissions_ai_check_status_check;

alter table public.submissions
add constraint submissions_ai_check_status_check
check (ai_check_status in (
  'not_analyzed',
  'pending',
  'screened',
  'manual',
  'complete',
  'unavailable',
  'error'
));
