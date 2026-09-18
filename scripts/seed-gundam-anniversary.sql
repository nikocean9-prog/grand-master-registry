-- Gundam Card Game: 1st Anniversary English promo registry.
-- Source: https://www.gundam-gcg.com/en/events/AnniversaryEvent.html
-- EXBP-028 English edition, numbered 001/999 through 999/999.
-- The catalog uses Bandai's SAMPLE image, not a confirmed pull photo.
-- This seed creates unreported serial slots only; it approves no submissions.
begin;

insert into public.card_sets
  (tcg_slug, slug, name, status, release_date, serials_per_card, serial_scheme)
values
  ('gundam', 'gundam-1st-anniversary', '1st Anniversary Promos · English',
   'live', '2026-09-12', 999, 'global')
on conflict (slug) do nothing;

insert into public.cards (set_id, name, card_number, image_url, serial_total)
select id, 'Strike Freedom Gundam — English', 'EXBP-028',
  '/graphics/gundam-strike-freedom-exbp-028-sample.webp', 999
from public.card_sets
where slug = 'gundam-1st-anniversary' and tcg_slug = 'gundam'
on conflict (set_id, name) do nothing;

insert into public.serials (card_id, serial_number, region, status)
select c.id, n, 'GLOBAL', 'unreported'
from public.cards c
join public.card_sets cs on cs.id = c.set_id
cross join generate_series(1, 999) as n
where cs.slug = 'gundam-1st-anniversary'
  and c.name = 'Strike Freedom Gundam — English'
on conflict (card_id, serial_number, region) do nothing;

commit;
