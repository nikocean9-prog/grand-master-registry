const WORDMARK_ROOT = "/graphics/mtg-set-wordmarks";

export const SET_WORDMARKS = {
  "dusk-till-dawn": "/graphics/new-set-wordmarks/dusk-till-dawn-transparent.webp",
  "gundam-1st-anniversary": "/graphics/new-set-wordmarks/gundam-1st-anniversary-transparent.webp",
  "world-convergence": "/graphics/new-set-wordmarks/world-convergence-transparent.webp",
  "jump-to-lightspeed": "/graphics/new-set-wordmarks/jump-to-lightspeed-transparent.webp",
  "legends-of-the-force": "/graphics/new-set-wordmarks/legends-of-the-force-transparent.webp",
  "secrets-of-power": "/graphics/new-set-wordmarks/secrets-of-power-transparent.webp",
  "a-lawless-time": "/graphics/new-set-wordmarks/a-lawless-time-transparent.webp",
  "ashes-of-the-empire": "/graphics/new-set-wordmarks/ashes-of-the-empire-transparent.webp",

  "dawn-of-ashes-first-edition": "/graphics/new-set-wordmarks/dawn-of-ashes-first-edition-transparent-v2.webp",
  "mercurial-heart-first-edition": "/graphics/new-set-wordmarks/mercurial-heart-first-edition-transparent-v2.webp",
  "heroes-clash-chrome-rares": "/graphics/new-set-wordmarks/heroes-clash-chrome-rares-transparent-v2.webp",
  "undaunted-raid-chrome-rares": "/graphics/new-set-wordmarks/undaunted-raid-chrome-rares-transparent-v2.webp",
  "saekano-serial-numbered": "/graphics/new-set-wordmarks/saekano-serial-numbered-transparent-v2.webp",
  "sao-alicization-vol-2-serial-numbered": "/graphics/new-set-wordmarks/sao-alicization-vol-2-serial-numbered-transparent-v2.webp",

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
  "flesh-and-blood": "/graphics/flesh-and-blood-logo.webp",
  digimon: "/graphics/digimon-logo.webp",
  "star-wars-unlimited": "/graphics/star-wars-unlimited-logo.webp",
  "grand-archive": "/graphics/grand-archive-logo-transparent-v2.webp",
  "universus": "/graphics/universus-logo-transparent-v2.webp",
  "weiss-schwarz": "/graphics/weiss-schwarz-logo-transparent-v2.webp",

  gundam: "/graphics/gundam-logo-restored.webp",
  yugioh: "/graphics/yugioh-official-logo-hq.webp",
  "magic-the-gathering": "/graphics/magic-official-logo-hq.webp",
};

export function getSetWordmark(slug) {
  return SET_WORDMARKS[slug] || null;
}

export const SET_BRAND_LABELS = {"gundam-1st-anniversary": "English · Serialised Anniversary Promos", "dusk-till-dawn": "Serialised Artist Sketch Cards", "world-convergence": "BT-21 · Serialised Omnimon", "jump-to-lightspeed": "Carbonite Edition · Serialised Prestige", "legends-of-the-force": "Carbonite Edition · Serialised Prestige", "secrets-of-power": "Carbonite Edition · Serialised Prestige", "a-lawless-time": "Carbonite Edition · Serialised Prestige", "ashes-of-the-empire": "Carbonite Edition · Serialised Prestige", "dawn-of-ashes-first-edition": "First Edition · Collector Ultra Rares", "mercurial-heart-first-edition": "First Edition · Collector Ultra Rare", "heroes-clash-chrome-rares": "My Hero Academia · Chrome Rares", "undaunted-raid-chrome-rares": "My Hero Academia · Chrome Rares", "saekano-serial-numbered": "English · Serialised SPs", "sao-alicization-vol-2-serial-numbered": "Vol. 2 · English Serialised SPs"};

export const MAGIC_STYLE_TCGS = ["grand-archive", "universus", "weiss-schwarz", "flesh-and-blood", "gundam", "digimon", "star-wars-unlimited"];
