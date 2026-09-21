const WORDMARK_ROOT = "/graphics/mtg-set-wordmarks";

export const SET_WORDMARKS = {
  "dawn-of-ashes-first-edition": "/graphics/new-set-wordmarks/dawn-of-ashes-first-edition.webp",
  "mercurial-heart-first-edition": "/graphics/new-set-wordmarks/mercurial-heart-first-edition.webp",
  "heroes-clash-chrome-rares": "/graphics/new-set-wordmarks/heroes-clash-chrome-rares.webp",
  "undaunted-raid-chrome-rares": "/graphics/new-set-wordmarks/undaunted-raid-chrome-rares.webp",
  "saekano-serial-numbered": "/graphics/new-set-wordmarks/saekano-serial-numbered.webp",
  "sao-alicization-vol-2-serial-numbered": "/graphics/new-set-wordmarks/sao-alicization-vol-2-serial-numbered.webp",

  "magnificent-monsters": "/magnificent-monsters-wordmark.webp",
  "magnificent-maestros": "/magnificent-maestros-wordmark-v4.png",
  "lotr-original": `${WORDMARK_ROOT}/lotr-original.webp`,
  "lotr-special-edition": `${WORDMARK_ROOT}/lotr-special-edition.webp`,
  "mtg-final-fantasy": `${WORDMARK_ROOT}/final-fantasy.webp`,
  "secret-lair-serialized-promos": `${WORDMARK_ROOT}/secret-lair-serialized-promos.webp`,
  "the-brothers-war": `${WORDMARK_ROOT}/the-brothers-war.webp`,
  "march-of-the-machine": `${WORDMARK_ROOT}/march-of-the-machine.webp`,
  "doctor-who": `${WORDMARK_ROOT}/doctor-who.webp`,
  "ravnica-remastered": `${WORDMARK_ROOT}/ravnica-remastered.webp`,
  "murders-at-karlov-manor": `${WORDMARK_ROOT}/murders-at-karlov-manor.webp`,
  fallout: `${WORDMARK_ROOT}/fallout.webp`,
  "modern-horizons-3": `${WORDMARK_ROOT}/modern-horizons-3.webp`,
  "assassins-creed": `${WORDMARK_ROOT}/assassins-creed.webp`,
  "innistrad-remastered": `${WORDMARK_ROOT}/innistrad-remastered.webp`,
  aetherdrift: `${WORDMARK_ROOT}/aetherdrift.webp`,
  "tarkir-dragonstorm": `${WORDMARK_ROOT}/tarkir-dragonstorm.webp`,
  "lorwyn-eclipsed": `${WORDMARK_ROOT}/lorwyn-eclipsed.webp`,
  "secrets-of-strixhaven": `${WORDMARK_ROOT}/secrets-of-strixhaven.webp`,
};

export const TCG_HEADER_LOGOS = {
  "grand-archive": "/graphics/grand-archive-logo.webp",
  "universus": "/graphics/universus-logo.webp",
  "weiss-schwarz": "/graphics/weiss-schwarz-logo.webp",

  gundam: "/graphics/gundam-official-logo.png",
  yugioh: "/graphics/yugioh-official-logo-hq.webp",
  "magic-the-gathering": "/graphics/magic-official-logo-hq.webp",
};

export function getSetWordmark(slug) {
  return SET_WORDMARKS[slug] || null;
}

export const SET_BRAND_LABELS = {"dawn-of-ashes-first-edition": "First Edition · Collector Ultra Rares", "mercurial-heart-first-edition": "First Edition · Collector Ultra Rare", "heroes-clash-chrome-rares": "My Hero Academia · Chrome Rares", "undaunted-raid-chrome-rares": "My Hero Academia · Chrome Rares", "saekano-serial-numbered": "English · Serialised SPs", "sao-alicization-vol-2-serial-numbered": "Vol. 2 · English Serialised SPs"};
