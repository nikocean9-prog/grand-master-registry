alter table public.card_sets
  add column serial_scheme text not null default 'regional'
  check (serial_scheme in ('regional', 'global'));

alter table public.cards
  add column serial_total integer not null default 200
  check (serial_total > 0);

alter table public.serials drop constraint if exists serials_serial_number_check;
alter table public.serials add constraint serials_serial_number_check
  check (serial_number >= 1 and serial_number <= 10000);

alter table public.serials drop constraint if exists serials_region_check;
alter table public.serials add constraint serials_region_check
  check (region in ('AMERICAS', 'E', 'GLOBAL'));

insert into public.card_sets (tcg_slug, slug, name, status, release_date, serials_per_card, serial_scheme)
values
  ('magic-the-gathering', 'lotr-original', 'The Lord of the Rings · Original Release', 'live', '2023-06-23', 1, 'global'),
  ('magic-the-gathering', 'lotr-special-edition', 'The Lord of the Rings · Special Edition', 'live', '2023-11-03', 100, 'global'),
  ('magic-the-gathering', 'mtg-final-fantasy', 'Magic: The Gathering—FINAL FANTASY', 'live', '2025-06-13', 77, 'global');

with card_data(set_slug, name, image_url, serial_total, position) as (
  values
    ('lotr-original', 'The One Ring', 'https://media.wizards.com/2023/images/daily/en_T2CA6K33JjSe.png', 1, 1),
    ('lotr-original', 'Sol Ring (Elven)', 'https://media.wizards.com/2023/images/daily/en_64Hqgy4U7vcH.png', 300, 2),
    ('lotr-original', 'Sol Ring (Dwarven)', 'https://media.wizards.com/2023/images/daily/en_rA1QlagB6XgA.png', 700, 3),
    ('lotr-original', 'Sol Ring (Human)', 'https://media.wizards.com/2023/images/daily/en_lDvhWlOlEyKP.png', 900, 4),
    ('lotr-special-edition', 'Andúril, Flame of the West', 'https://scg-static.starcitygames.com/articles/2023/09/a4da3c57-anduril-flame-of-the-west.png', 100, 5),
    ('lotr-special-edition', 'Aragorn, the Uniter', 'https://scg-static.starcitygames.com/articles/2023/09/a4da3c57-aragorn-the-uniter.png', 100, 6),
    ('lotr-special-edition', 'Arwen, Mortal Queen', 'https://scg-static.starcitygames.com/articles/2023/09/a4da3c57-arwen-mortal-queen.png', 100, 7),
    ('lotr-special-edition', 'Dawn of a New Age', 'https://scg-static.starcitygames.com/articles/2023/09/4298f35b-dawn-of-a-new-age.png', 100, 8),
    ('lotr-special-edition', 'Gandalf the White', 'https://scg-static.starcitygames.com/articles/2023/09/e4df3500-gandalf-the-white.png', 100, 9),
    ('lotr-special-edition', 'Glamdring', 'https://scg-static.starcitygames.com/articles/2023/09/4f34e99f-glamdring.png', 100, 10),
    ('lotr-special-edition', 'Hew the Entwood', 'https://scg-static.starcitygames.com/articles/2023/09/98a2fa6e-hew-the-entwood.png', 100, 11),
    ('lotr-special-edition', 'Last March of the Ents', 'https://scg-static.starcitygames.com/articles/2023/09/0dc9a017-last-march-of-the-ents.png', 100, 12),
    ('lotr-special-edition', 'Mount Doom', 'https://scg-static.starcitygames.com/articles/2023/09/0dc9a017-mount-doom.png', 100, 13),
    ('lotr-special-edition', 'Palantír of Orthanc', 'https://scg-static.starcitygames.com/articles/2023/09/fdb50050-palantir-of-orthanc.png', 100, 14),
    ('lotr-special-edition', 'Radagast the Brown', 'https://scg-static.starcitygames.com/articles/2023/09/5b17528d-radagast-the-brown.png', 100, 15),
    ('lotr-special-edition', 'Saruman of Many Colors', 'https://scg-static.starcitygames.com/articles/2023/09/c6058b93-saruman-of-many-colors.png', 100, 16),
    ('lotr-special-edition', 'Sauron, the Dark Lord', 'https://scg-static.starcitygames.com/articles/2023/09/8fea5e4e-sauron-the-dark-lord.png', 100, 17),
    ('lotr-special-edition', 'Shadow of the Enemy', 'https://scg-static.starcitygames.com/articles/2023/09/159ed9ca-shadow-of-the-enemy.png', 100, 18),
    ('lotr-special-edition', 'Spiteful Banditry', 'https://scg-static.starcitygames.com/articles/2023/09/159ed9ca-spiteful-banditry.png', 100, 19),
    ('lotr-special-edition', 'Storm of Saruman', 'https://scg-static.starcitygames.com/articles/2023/09/26662d2b-storm-of-saruman.png', 100, 20),
    ('lotr-special-edition', 'The One Ring', 'https://scg-static.starcitygames.com/articles/2023/09/173c710a-the-one-ring.png', 100, 21),
    ('lotr-special-edition', 'The Watcher in the Water', 'https://scg-static.starcitygames.com/articles/2023/09/26662d2b-the-watcher-in-the-water.png', 100, 22),
    ('lotr-special-edition', 'Tom Bombadil', 'https://scg-static.starcitygames.com/articles/2023/09/a48ebf1d-tom-bombadil.png', 100, 23),
    ('lotr-special-edition', 'Witch-king of Angmar', 'https://scg-static.starcitygames.com/articles/2023/09/a48ebf1d-witch-king-of-angmar.png', 100, 24),
    ('lotr-special-edition', 'The Party Tree', 'https://cardgamebase.com/wp-content/uploads/The-PArty-Tree-LotR-Box-Toppers-Realms-Relics.png', 100, 25),
    ('lotr-special-edition', 'Elessar, the Elfstone', 'https://cardgamebase.com/wp-content/uploads/Elessar-the-Elfstone-Tales-of-Middle-earth-Box-Toppers.png', 100, 26),
    ('lotr-special-edition', 'Bridge of Khazad-dûm', 'https://cardgamebase.com/wp-content/uploads/Bridge-of-Khazad-dum-Tales-of-Middle-earth-Box-Toppers-List.png', 100, 27),
    ('lotr-special-edition', 'Argonath, Pillars of the Kings', 'https://cardgamebase.com/wp-content/uploads/Argonath-Pillars-of-the-Kings-MTG-Card.png', 100, 28),
    ('lotr-special-edition', 'Three Rings for the Elven-Kings', 'https://cardgamebase.com/wp-content/uploads/Three-Rings-for-the-Elven-Kings-MTG.png', 100, 29),
    ('lotr-special-edition', 'Morgul-Knife', 'https://cardgamebase.com/wp-content/uploads/Morgul-Knife-Tales-of-Middle-earth-Box-Toppers.png', 100, 30),
    ('lotr-special-edition', 'Herugrim, Sword of Rohan', 'https://cardgamebase.com/wp-content/uploads/Sword-of-Rohan-LotR-Box-Toppers-List.jpg', 100, 31),
    ('lotr-special-edition', 'Ring of Barahir', 'https://cardgamebase.com/wp-content/uploads/Ring-of-Barahir-Tales-of-Middle-earth-Box-Toppers.jpg', 100, 32),
    ('lotr-special-edition', 'Shards of Narsil', 'https://cardgamebase.com/wp-content/uploads/Shards-of-Narsil-Tales-of-Middle-earth-Box-Toppers.jpg', 100, 33),
    ('lotr-special-edition', 'Balin''s Tomb', 'https://cardgamebase.com/wp-content/uploads/Balins-Tomb-MTG-LotR-Box-Toppers.png', 100, 34),
    ('lotr-special-edition', 'Barrow-Downs', 'https://cardgamebase.com/wp-content/uploads/Barrow-Downs-MTG-LotR-Box-Toppers.png', 100, 35),
    ('lotr-special-edition', 'Isengard, Saruman''s Fortress', 'https://cardgamebase.com/wp-content/uploads/Isengard-Sarumans-Fortress-LotR-Box-Toppers.png', 100, 36),
    ('lotr-special-edition', 'Minas Morgul', 'https://cardgamebase.com/wp-content/uploads/Minas-Morgul-MTG-LotR-Box-Toppers-Full-List.jpg', 100, 37),
    ('lotr-special-edition', 'Meduseld, Golden Hall of Edoras', 'https://cardgamebase.com/wp-content/uploads/Meduseld-Golden-Hall-of-Edoras-LotR-Box-Toppers-Full-List.jpg', 100, 38),
    ('lotr-special-edition', 'Paths of the Dead', 'https://cardgamebase.com/wp-content/uploads/Paths-of-the-Dead-MTG-LotR-Box-Toppers.png', 100, 39),
    ('lotr-special-edition', 'Weathertop', 'https://cardgamebase.com/wp-content/uploads/Weathertop-MTG.png', 100, 40),
    ('lotr-special-edition', 'Glittering Caves of Aglarond', 'https://cardgamebase.com/wp-content/uploads/Glittering-Caves-of-Aglarond-LotR-Box-Toppers-Full-List.jpg', 100, 41),
    ('lotr-special-edition', 'Green Dragon Inn', 'https://cardgamebase.com/wp-content/uploads/Green-Dragon-Inn-Tales-of-Middle-earth-Box-Toppers.png', 100, 42),
    ('lotr-special-edition', 'Bag End', 'https://cardgamebase.com/wp-content/uploads/Bag-End-LotR-Box-Toppers-Full-List.jpg', 100, 43),
    ('lotr-special-edition', 'White Tower of Ecthelion', 'https://cardgamebase.com/wp-content/uploads/White-Tower-of-Ecthelion-LotR-Box-Toppers-Full-List.jpg', 100, 44),
    ('lotr-special-edition', 'Osgiliath, Fallen Capital', 'https://cardgamebase.com/wp-content/uploads/Osgiliath-Fallen-Capital.jpg', 100, 45),
    ('lotr-special-edition', 'Dol Amroth', 'https://cardgamebase.com/wp-content/uploads/Dol-Amorth-MTG-LotR-Box-Toppers-List.png', 100, 46),
    ('lotr-special-edition', 'Redhorn Pass', 'https://cardgamebase.com/wp-content/uploads/Redhorn-Pass-LotR-Box-Toppers-List.jpg', 100, 47),
    ('lotr-special-edition', 'Bucklebury Ferry', 'https://cardgamebase.com/wp-content/uploads/Buckleberry-Ferry-Tales-of-Middle-earth-Box-Toppers.jpg', 100, 48),
    ('lotr-special-edition', 'Inn of the Prancing Pony', 'https://cardgamebase.com/wp-content/uploads/Inn-of-the-Prancing-Pony.jpg', 100, 49),
    ('lotr-special-edition', 'Henneth Annûn', 'https://cardgamebase.com/wp-content/uploads/Henneth-Annun-LotR-Box-Toppers-Full-List.jpg', 100, 50),
    ('lotr-special-edition', 'Helm''s Deep', 'https://cardgamebase.com/wp-content/uploads/Helms-Deep-Tales-of-Middle-earth-Box-Toppers-List.jpg', 100, 51),
    ('lotr-special-edition', 'The Dead Marshes', 'https://cardgamebase.com/wp-content/uploads/The-Dead-Marshes-What-Are-LotR-Box-Toppers.jpg', 100, 52),
    ('lotr-special-edition', 'Valley of Gorgoroth', 'https://cardgamebase.com/wp-content/uploads/Valley-of-Gorgoroth-MTG-LotR-Box-Toppers.png', 100, 53),
    ('lotr-special-edition', 'Fangorn Forest', 'https://cardgamebase.com/wp-content/uploads/Fangorn-Forest-Tales-of-Middle-earth-Box-Toppers.png', 100, 54),
    ('mtg-final-fantasy', 'Golden Traveling Chocobo', 'https://storage.googleapis.com/images.pricecharting.com/545uzwqdfss6nrio/1600.jpg', 77, 55)
), next_card_id as (
  select coalesce(max(id), 0) as value from public.cards
)
insert into public.cards (id, name, image_url, serial_total, set_id)
select next_card_id.value + card_data.position,
       card_data.name,
       card_data.image_url,
       card_data.serial_total,
       card_sets.id
from card_data
join public.card_sets on card_sets.slug = card_data.set_slug
cross join next_card_id;

with new_serials as (
  select cards.id as card_id,
         numbers.serial_number,
         row_number() over (order by cards.id, numbers.serial_number) as position
  from public.cards
  join public.card_sets on card_sets.id = cards.set_id
  cross join lateral generate_series(1, cards.serial_total) as numbers(serial_number)
  where card_sets.slug in ('lotr-original', 'lotr-special-edition', 'mtg-final-fantasy')
), next_serial_id as (
  select coalesce(max(id), 0) as value from public.serials
)
insert into public.serials (id, card_id, serial_number, region, status)
select next_serial_id.value + new_serials.position,
       new_serials.card_id,
       new_serials.serial_number,
       'GLOBAL',
       'unreported'
from new_serials
cross join next_serial_id;
