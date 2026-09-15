alter table public.bulk_upload_items
  drop constraint if exists bulk_upload_items_detected_region_check;

alter table public.bulk_upload_items
  add constraint bulk_upload_items_detected_region_check
  check (detected_region = any (array['AMERICAS'::text, 'E'::text, 'GLOBAL'::text]));
