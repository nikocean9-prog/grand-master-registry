export const tcgs = [
  { slug: "yugioh", name: "Yu-Gi-Oh!", initials: "YGO", status: "live", description: "Track serial-numbered Yu-Gi-Oh! cards by release and region.", sets: [{ slug: "magnificent-monsters", name: "Magnificent Monsters", status: "live", summary: "18 Grand Master Rares · 3,600 serial numbers", href: "/sets/magnificent-monsters" }] },
  { slug: "pokemon", name: "Pokémon", initials: "PKM", status: "planned", description: "A future home for numbered Pokémon releases and Japanese promos.", sets: [{ name: "Japanese serialised releases", status: "planned" }] },
  { slug: "magic-the-gathering", name: "Magic: The Gathering", initials: "MTG", status: "planned", description: "Track serialized cards across major Magic releases.", sets: [{ name: "The Lord of the Rings: Tales of Middle-earth", status: "planned" }, { name: "Magic: The Gathering—FINAL FANTASY", status: "planned" }] },
  { slug: "one-piece", name: "One Piece Card Game", initials: "OP", status: "planned", description: "A planned registry for numbered One Piece cards.", sets: [] },
  { slug: "dragon-ball-super", name: "Dragon Ball Super Card Game", initials: "DBS", status: "planned", description: "A planned registry for serial-numbered Dragon Ball cards.", sets: [] },
  { slug: "disney-lorcana", name: "Disney Lorcana", initials: "DLC", status: "planned", description: "A planned registry for rare and numbered Lorcana releases.", sets: [] },
  { slug: "flesh-and-blood", name: "Flesh and Blood", initials: "FAB", status: "planned", description: "A planned registry for limited and numbered Flesh and Blood cards.", sets: [] },
  { slug: "digimon", name: "Digimon Card Game", initials: "DGM", status: "planned", description: "A planned registry for limited Digimon releases.", sets: [] },
  { slug: "final-fantasy", name: "Final Fantasy TCG", initials: "FF", status: "planned", description: "A planned registry for special Final Fantasy TCG releases.", sets: [] },
  { slug: "star-wars-unlimited", name: "Star Wars: Unlimited", initials: "SWU", status: "planned", description: "A planned registry for serialized Star Wars: Unlimited cards.", sets: [] },
];

export function getTcg(slug) {
  return tcgs.find((tcg) => tcg.slug === slug);
}
