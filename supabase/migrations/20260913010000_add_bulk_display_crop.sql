alter table public.bulk_upload_items
add column if not exists display_crop jsonb;

comment on column public.bulk_upload_items.display_crop is
  'Non-destructive normalized crop and rotation chosen while reviewing a bulk-upload photo.';

alter table public.bulk_upload_items
drop constraint if exists bulk_upload_items_display_crop_valid;

alter table public.bulk_upload_items
add constraint bulk_upload_items_display_crop_valid check (
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
    and jsonb_typeof(display_crop -> 'frame') = 'object'
    and (display_crop -> 'frame' ->> 'cx')::numeric between 0 and 1
    and (display_crop -> 'frame' ->> 'cy')::numeric between 0 and 1
    and (display_crop -> 'frame' ->> 'width')::numeric between 0.12 and 0.96
    and (display_crop -> 'frame' ->> 'height')::numeric between 0.12 and 0.96
    and (display_crop -> 'frame' ->> 'rotation')::numeric between -45 and 45
  )
);
