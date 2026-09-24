const TCG_CARD_BACKS = {
  "neopets-battledome": "https://collectorstore.com/cdn/shop/files/31674515-back.jpg?v=1755885162&width=1445",
  altered: "https://i.ebayimg.com/images/g/Fu8AAOSwwxNm7X~C/s-l1200.jpg",
  "cardfight-vanguard": "https://i.ebayimg.com/images/g/3TsAAOSwVYJmVYea/s-l1200.png",
  riftbound: "https://i.ebayimg.com/images/g/K00AAeSwEjFpksv1/s-l1200.jpg",
  "weiss-schwarz": "https://upload.wikimedia.org/wikipedia/en/c/c0/Wei%C3%9F_Schwarz_cardback.png",
  universus: "/graphics/card-backs/universus-legacy-card-back.webp",
  "grand-archive": "https://www.gatcg.com/_nuxt/img/back.d4a22a4.jpg",
  gundam: "/graphics/card-backs/gundam-card-back.webp",
  yugioh: "/graphics/card-backs/yugioh-card-back-v2.webp",
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
  "cardfight-vanguard": "59 / 86",
};

export function getTcgCardBack(tcgSlug, setSlug) {
  if (setSlug === "abyssal-heaven-first-edition") return "https://api.gatcg.com/cards/images/l5izukgdmh.jpg";
  if (tcgSlug === "universus" && setSlug && !["heroes-clash-chrome-rares", "undaunted-raid-chrome-rares"].includes(setSlug)) {
    return "https://www.tabletopgamingnews.com/wp-content/uploads/2023/07/UniVersus_NEW_CardBack-731x1024.png";
  }
  return TCG_CARD_BACKS[tcgSlug] || null;
}

export function getTcgCardAspectRatio(tcgSlug) {
  return TCG_CARD_ASPECT_RATIOS[tcgSlug] || "63 / 88";
}

// Crop photographed outer backgrounds in the presentation layer only.
export function getTcgCardBackPresentation(tcgSlug) {
  return {
    "cardfight-vanguard": { size: "109% 104%", position: "center" },
    altered: { size: "132% 129%", position: "43% 48%" },
    "neopets-battledome": { size: "102% 102%", position: "center" },
  }[tcgSlug] || { size: "cover", position: "center" };
}
