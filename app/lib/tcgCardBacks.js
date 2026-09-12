const TCG_CARD_BACKS = {
  yugioh: "/graphics/card-backs/yugioh-card-back-hq.webp",
  pokemon: "/graphics/card-backs/pokemon-card-back-hq.webp",
  "magic-the-gathering": "/graphics/card-backs/mtg-card-back-hq.webp",
  "one-piece": "/graphics/card-backs/one-piece-card-back-hq.webp",
  "dragon-ball-super": "/graphics/card-backs/dragon-ball-super-card-back-hq.webp",
  "disney-lorcana": "/graphics/card-backs/disney-lorcana-card-back-hq.webp",
  "flesh-and-blood": "/graphics/card-backs/flesh-and-blood-card-back-hq.webp",
  digimon: "/graphics/card-backs/digimon-card-back-hq.webp",
  "final-fantasy": "/graphics/card-backs/final-fantasy-card-back-hq.webp",
  "star-wars-unlimited": "/graphics/card-backs/star-wars-unlimited-card-back-hq.webp",
};

const TCG_CARD_ASPECT_RATIOS = {
  yugioh: "59 / 86",
};

export function getTcgCardBack(tcgSlug) {
  return TCG_CARD_BACKS[tcgSlug] || null;
}

export function getTcgCardAspectRatio(tcgSlug) {
  return TCG_CARD_ASPECT_RATIOS[tcgSlug] || "63 / 88";
}
