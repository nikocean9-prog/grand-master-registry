-- Initial Grand Archive, UniVersus and Weiss Schwarz registries.

-- Provenance: scripts/serialised-games-sources.json. Catalogue art is not pull evidence.

-- Idempotent: preserves existing cards, reports and approvals.

begin;

insert into public.card_sets (tcg_slug,slug,name,status,serials_per_card,serial_scheme) values ('grand-archive','dawn-of-ashes-first-edition','Dawn of Ashes · First Edition CURs','live',70,'global') on conflict (slug) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Lorraine, Wandering Warrior','DOA1st EN-004 CUR','https://ga-index-public.s3.us-west-2.amazonaws.com/cards/lorraine-wandering-warrior-doa1e-cur.jpg',70 from public.card_sets where slug='dawn-of-ashes-first-edition' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Lorraine, Blademaster','DOA1st EN-005 CUR','https://ga-index-public.s3.us-west-2.amazonaws.com/cards/lorraine-blademaster-doa1e-cur.jpg',70 from public.card_sets where slug='dawn-of-ashes-first-edition' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Lorraine, Spirit Ruler','DOA1st EN-006 CUR','https://ga-index-public.s3.us-west-2.amazonaws.com/cards/lorraine-spirit-ruler-doa1e-cur.jpg',70 from public.card_sets where slug='dawn-of-ashes-first-edition' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Rai, Spellcrafter','DOA1st EN-007 CUR','https://ga-index-public.s3.us-west-2.amazonaws.com/cards/rai-spellcrafter-doa1e-cur.jpg',70 from public.card_sets where slug='dawn-of-ashes-first-edition' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Rai, Archmage','DOA1st EN-008 CUR','https://ga-index-public.s3.us-west-2.amazonaws.com/cards/rai-archmage-doa1e-cur.jpg',70 from public.card_sets where slug='dawn-of-ashes-first-edition' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Rai, Mana Weaver','DOA1st EN-009 CUR','https://ga-index-public.s3.us-west-2.amazonaws.com/cards/rai-mana-weaver-doa1e-cur.jpg',70 from public.card_sets where slug='dawn-of-ashes-first-edition' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Silvie, Wilds Whisperer','DOA1st EN-010 CUR','https://ga-index-public.s3.us-west-2.amazonaws.com/cards/silvie-wilds-whisperer-doa1e-cur.jpg',70 from public.card_sets where slug='dawn-of-ashes-first-edition' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Silvie, With the Pack','DOA1st EN-011 CUR','https://ga-index-public.s3.us-west-2.amazonaws.com/cards/silvie-with-the-pack-doa1e-cur.jpg',70 from public.card_sets where slug='dawn-of-ashes-first-edition' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Silvie, Earth''s Tune','DOA1st EN-012 CUR','https://ga-index-public.s3.us-west-2.amazonaws.com/cards/silvie-earths-tune-doa1e-cur.jpg',70 from public.card_sets where slug='dawn-of-ashes-first-edition' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Zander, Prepared Scout','DOA1st EN-013 CUR','https://ga-index-public.s3.us-west-2.amazonaws.com/cards/zander-prepared-scout-doa1e-cur.jpg',70 from public.card_sets where slug='dawn-of-ashes-first-edition' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Zander, Always Watching','DOA1st EN-014 CUR','https://ga-index-public.s3.us-west-2.amazonaws.com/cards/zander-always-watching-doa1e-cur.jpg',70 from public.card_sets where slug='dawn-of-ashes-first-edition' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Zander, Corhazi''s Chosen','DOA1st EN-015 CUR','https://ga-index-public.s3.us-west-2.amazonaws.com/cards/zander-corhazis-chosen-doa1e-cur.jpg',70 from public.card_sets where slug='dawn-of-ashes-first-edition' on conflict (set_id,name) do nothing;

insert into public.serials (card_id,serial_number,region,status) select c.id,n,'GLOBAL','unreported' from public.cards c join public.card_sets cs on cs.id=c.set_id cross join generate_series(1,70) n where cs.slug='dawn-of-ashes-first-edition' on conflict (card_id,serial_number,region) do nothing;

insert into public.card_sets (tcg_slug,slug,name,status,serials_per_card,serial_scheme) values ('universus','heroes-clash-chrome-rares','My Hero Academia: Heroes Clash · Chrome Rares','live',100,'global') on conflict (slug) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Eijiro Kirishima (Serial Numbered)','1/5 CR',NULL,100 from public.card_sets where slug='heroes-clash-chrome-rares' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Izuku Midoriya (Serial Numbered)','2/5 CR','https://tcgplayer-cdn.tcgplayer.com/product/450517_in_1000x1000.jpg',100 from public.card_sets where slug='heroes-clash-chrome-rares' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Katsuki Bakugo (Serial Numbered)','3/5 CR','https://tcgplayer-cdn.tcgplayer.com/product/450520_in_1000x1000.jpg',100 from public.card_sets where slug='heroes-clash-chrome-rares' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Shoto Todoroki (Serial Numbered)','4/5 CR','https://tcgplayer-cdn.tcgplayer.com/product/450523_in_1000x1000.jpg',100 from public.card_sets where slug='heroes-clash-chrome-rares' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Tenya Iida (Serial Numbered)','5/5 CR','https://tcgplayer-cdn.tcgplayer.com/product/450525_in_1000x1000.jpg',100 from public.card_sets where slug='heroes-clash-chrome-rares' on conflict (set_id,name) do nothing;

insert into public.serials (card_id,serial_number,region,status) select c.id,n,'GLOBAL','unreported' from public.cards c join public.card_sets cs on cs.id=c.set_id cross join generate_series(1,100) n where cs.slug='heroes-clash-chrome-rares' on conflict (card_id,serial_number,region) do nothing;

insert into public.card_sets (tcg_slug,slug,name,status,serials_per_card,serial_scheme) values ('weiss-schwarz','saekano-serial-numbered','Saekano: How to Raise a Boring Girlfriend · English Serialised SPs','live',10,'global') on conflict (slug) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Qualities of a Maiden, Eriri (Serialised SP)','SHS/W56-E001SP','https://tcgplayer-cdn.tcgplayer.com/product/450542_in_1000x1000.jpg',10 from public.card_sets where slug='saekano-serial-numbered' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Tomoya''s Beloved Disciple, Izumi (Serialised SP)','SHS/W56-E002SP','https://tcgplayer-cdn.tcgplayer.com/product/450547_in_1000x1000.jpg',10 from public.card_sets where slug='saekano-serial-numbered' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Ideal Girl, Megumi (Serialised SP)','SHS/W56-E032SP','https://tcgplayer-cdn.tcgplayer.com/product/450551_in_1000x1000.jpg',10 from public.card_sets where slug='saekano-serial-numbered' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'Pride of Creators, Utaha (Serialised SP)','SHS/W56-E059SP','https://tcgplayer-cdn.tcgplayer.com/product/450546_in_1000x1000.jpg',10 from public.card_sets where slug='saekano-serial-numbered' on conflict (set_id,name) do nothing;

insert into public.cards (set_id,name,card_number,image_url,serial_total) select id,'icy tail, Michiru (Serialised SP)','SHS/W56-E081SP','https://tcgplayer-cdn.tcgplayer.com/product/450549_in_1000x1000.jpg',10 from public.card_sets where slug='saekano-serial-numbered' on conflict (set_id,name) do nothing;

insert into public.serials (card_id,serial_number,region,status) select c.id,n,'GLOBAL','unreported' from public.cards c join public.card_sets cs on cs.id=c.set_id cross join generate_series(1,10) n where cs.slug='saekano-serial-numbered' on conflict (card_id,serial_number,region) do nothing;

commit;
