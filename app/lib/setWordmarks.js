const WORDMARK_ROOT = "/graphics/mtg-set-wordmarks";

export const SET_WORDMARKS = {
  "magnificent-monsters": "/magnificent-monsters-wordmark-v4.png",
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
  yugioh: "/graphics/yugioh-official-logo.svg",
  "magic-the-gathering": "/graphics/magic-official-logo-dark.webp",
};

export function getSetWordmark(slug) {
  return SET_WORDMARKS[slug] || null;
}

