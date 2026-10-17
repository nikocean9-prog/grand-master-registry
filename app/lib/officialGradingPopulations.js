// Official-source observations only. Missing records are never treated as zero.
// These are Europe-distributed /100E English GMR records, NOT all-region totals.
const officialBgs = {
  2: {
    tcg: "yugioh", set: "magnificent-monsters", serialTotal: 200,
    region: "Europe-distributed /100E only", summary: "English GMR",
    printing: "2026 Magnificent Monsters 1st Edition · serial-numbered Grand Master Rare",
    name: "Kuriboh - Multiply!",
    cardNumber: "MAMO-EN002",
    source: "https://beckett.com/grading/pop-report/list-of-cards?type=card&page=1&limit=100&query=2026+Yu-Gi-Oh%21+TCG+Magnificent+Monsters+1st+Edition+%23MAMOEN002+Kuriboh+-+Multiply%21+EXT+ART+SERIAL+GMR%2F100E&sports=YuGiOh",
    gemMint95: 1,
  },
  3: {
    tcg: "yugioh", set: "magnificent-monsters", serialTotal: 200,
    region: "Europe-distributed /100E only", summary: "English GMR",
    printing: "2026 Magnificent Monsters 1st Edition · serial-numbered Grand Master Rare",
    name: "Dark Magical Curtain",
    cardNumber: "MAMO-EN003",
    source: "https://beckett.com/grading/pop-report/list-of-cards?type=card&page=1&limit=100&query=2026+Yu-Gi-Oh%21+TCG+Magnificent+Monsters+1st+Edition+%23MAMOEN003+Dark+Magical+Curtain+EXT+ART+SERIAL+GMR%2F100E&sports=YuGiOh",
    gemMint95: 3,
  },
  91: {
    tcg: "magic-the-gathering", set: "mtg-final-fantasy", serialTotal: 77,
    name: "Golden Traveling Chocobo", cardNumber: "0551f",
    region: "Global /77", summary: "English · serialized Golden Chocobo",
    printing: "2025 FINAL FANTASY · 0551f · serialized gold foil /77",
    source: "https://beckett.com/grading/pop-report/list-of-cards?type=card&page=1&limit=100&query=2025+Magic+The+Gathering+Final+Fantasy+%230551f+Traveling+Chocobo+GOLD+FOIL+M&sports=Magic+The+Gathering",
    identitySource: "https://magic.wizards.com/en/news/feature/collecting-final-fantasy",
    gemMint95: 8, mint9: 9, nearMintMint85: 1,
  },
};

export function getOfficialBgsPopulation(card) {
  const entry = officialBgs[Number(card.id)];
  if (!entry || card.name !== entry.name || card.card_sets?.tcg_slug !== entry.tcg || card.card_sets?.slug !== entry.set || Number(card.serial_total) !== entry.serialTotal) return null;
  const mint9 = entry.mint9 ?? 0;
  const nearMintMint85 = entry.nearMintMint85 ?? 0;
  return {
    ...entry,
    observedDate: "17 October 2026",
    language: "English",
    blackLabel10: 0,
    pristine10: 0,
    mint9, nearMintMint85,
    grades: { "9.5": entry.gemMint95, "9": mint9, "8.5": nearMintMint85, "8": 0, "7.5": 0, "7": 0, "6.5": 0, "6": 0, "5.5": 0, "5": 0, "4.5": 0, "4": 0, "3.5": 0, "3": 0, "2.5": 0, "2": 0, "1.5": 0, "1": 0 },
    otherBgs: 0,
    total: entry.gemMint95 + mint9 + nearMintMint85,
    previous: null,
  };
}
