alter table public.bulk_upload_items
  drop constraint if exists bulk_upload_items_status_check;

alter table public.bulk_upload_items
  add constraint bulk_upload_items_status_check
  check (status in ('queued', 'processing', 'ready', 'needs_review', 'error', 'dismissed'));
