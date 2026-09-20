-- Verified catalogue expansion. SAMPLE/catalogue artwork is not pull evidence.

-- Sources: serialised-expansion-sources.json; preserves all existing reports.

begin;

insert into public.card_sets (tcg_slug,slug,name,status,serials_per_card,serial_scheme) values ('grand-archive','mercurial-heart-first-edition','Mercurial Heart · First Edition CUR','live','72','global') on conflict (slug) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Tristan, Shadowreaver','MRC 1st EN-006 CUR','https://api.gatcg.com/cards/images/emozdelso9.jpg','72' from public.card_sets where slug='mercurial-heart-first-edition' on conflict (set_id,name) do nothing;

insert into public.serials (card_id,serial_number,region,status) select c.id,n,'GLOBAL','unreported' from public.cards c join public.card_sets cs on cs.id=c.set_id cross join generate_series(1,72) n where cs.slug='mercurial-heart-first-edition' on conflict (card_id,serial_number,region) do nothing;

insert into public.card_sets (tcg_slug,slug,name,status,serials_per_card,serial_scheme) values ('universus','undaunted-raid-chrome-rares','My Hero Academia: Undaunted Raid · Chrome Rares','live','100','global') on conflict (slug) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Rejuvenating Smash (Chrome Rare)','1/5 CR','https://tcgplayer-cdn.tcgplayer.com/product/502393_in_1000x1000.jpg','100' from public.card_sets where slug='undaunted-raid-chrome-rares' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Spiral Blasts (Chrome Rare)','2/5 CR','https://tcgplayer-cdn.tcgplayer.com/product/502397_in_1000x1000.jpg','100' from public.card_sets where slug='undaunted-raid-chrome-rares' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Vast Hybrid Chimera Kraken (Chrome Rare)','3/5 CR','https://tcgplayer-cdn.tcgplayer.com/product/502405_in_1000x1000.jpg','100' from public.card_sets where slug='undaunted-raid-chrome-rares' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Schoolyard Smackdown (Chrome Rare)','4/5 CR','https://tcgplayer-cdn.tcgplayer.com/product/502408_in_1000x1000.jpg','100' from public.card_sets where slug='undaunted-raid-chrome-rares' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Stalagmite Piercer (Chrome Rare)','5/5 CR','https://tcgplayer-cdn.tcgplayer.com/product/502410_in_1000x1000.jpg','100' from public.card_sets where slug='undaunted-raid-chrome-rares' on conflict (set_id,name) do nothing;

insert into public.serials (card_id,serial_number,region,status) select c.id,n,'GLOBAL','unreported' from public.cards c join public.card_sets cs on cs.id=c.set_id cross join generate_series(1,100) n where cs.slug='undaunted-raid-chrome-rares' on conflict (card_id,serial_number,region) do nothing;

insert into public.card_sets (tcg_slug,slug,name,status,serials_per_card,serial_scheme) values ('weiss-schwarz','sao-alicization-vol-2-serial-numbered','Sword Art Online Alicization Vol. 2 · English Serialised SPs','live','10','global') on conflict (slug) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Unbending Fighting Spirit, Asuna (Serialised SP)','SAO/S80-E004SP','https://tcgplayer-cdn.tcgplayer.com/product/252408_in_1000x1000.jpg','10' from public.card_sets where slug='sao-alicization-vol-2-serial-numbered' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Priestess of Light, Alice (Serialised SP)','SAO/S80-E005SP','https://tcgplayer-cdn.tcgplayer.com/product/252409_in_1000x1000.jpg','10' from public.card_sets where slug='sao-alicization-vol-2-serial-numbered' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'As His Little Sister, Leafa (Serialised SP)','SAO/S80-E033SP','https://tcgplayer-cdn.tcgplayer.com/product/252410_in_1000x1000.jpg','10' from public.card_sets where slug='sao-alicization-vol-2-serial-numbered' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Time to Rise Up, Kirito (Serialised SP)','SAO/S80-E073SP','https://tcgplayer-cdn.tcgplayer.com/product/252411_in_1000x1000.jpg','10' from public.card_sets where slug='sao-alicization-vol-2-serial-numbered' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'"Aincrad Style" Eugeo (Serialised SP)','SAO/S80-E075SP','https://tcgplayer-cdn.tcgplayer.com/product/252412_in_1000x1000.jpg','10' from public.card_sets where slug='sao-alicization-vol-2-serial-numbered' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'"Light That Penetrates Darkness" Sinon (Serialised SP)','SAO/S80-E076SP','https://tcgplayer-cdn.tcgplayer.com/product/252413_in_1000x1000.jpg','10' from public.card_sets where slug='sao-alicization-vol-2-serial-numbered' on conflict (set_id,name) do nothing;

insert into public.serials (card_id,serial_number,region,status) select c.id,n,'GLOBAL','unreported' from public.cards c join public.card_sets cs on cs.id=c.set_id cross join generate_series(1,10) n where cs.slug='sao-alicization-vol-2-serial-numbered' on conflict (card_id,serial_number,region) do nothing;

commit;
