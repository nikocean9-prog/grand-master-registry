// Official-source observations only. Missing records are never treated as zero.
// These are Europe-distributed /100E English GMR records, NOT all-region totals.
const bgsEurope = {
  2: {
    name: "Kuriboh - Multiply!",
    cardNumber: "MAMO-EN002",
    source: "https://beckett.com/grading/pop-report/list-of-cards?type=card&page=1&limit=100&query=2026+Yu-Gi-Oh%21+TCG+Magnificent+Monsters+1st+Edition+%23MAMOEN002+Kuriboh+-+Multiply%21+EXT+ART+SERIAL+GMR%2F100E&sports=YuGiOh",
    gemMint95: 1,
  },
  3: {
    name: "Dark Magical Curtain",
    cardNumber: "MAMO-EN003",
    source: "https://beckett.com/grading/pop-report/list-of-cards?type=card&page=1&limit=100&query=2026+Yu-Gi-Oh%21+TCG+Magnificent+Monsters+1st+Edition+%23MAMOEN003+Dark+Magical+Curtain+EXT+ART+SERIAL+GMR%2F100E&sports=YuGiOh",
    gemMint95: 3,
  },
};

export function getOfficialBgsPopulation(card) {
  if (card.card_sets?.tcg_slug !== "yugioh" || card.card_sets?.slug !== "magnificent-monsters") return null;
  const entry = bgsEurope[Number(card.id)];
  if (!entry || card.name !== entry.name) return null;
  return {
    ...entry,
    observedDate: "17 October 2026",
    region: "Europe-distributed /100E only",
    language: "English",
    printing: "2026 Magnificent Monsters 1st Edition · serial-numbered Grand Master Rare",
    blackLabel10: 0,
    pristine10: 0,
    grades: { "9.5": entry.gemMint95, "9": 0, "8.5": 0, "8": 0, "7.5": 0, "7": 0, "6.5": 0, "6": 0, "5.5": 0, "5": 0, "4.5": 0, "4": 0, "3.5": 0, "3": 0, "2.5": 0, "2": 0, "1.5": 0, "1": 0 },
    otherBgs: 0,
    total: entry.gemMint95,
    previous: null,
  };
}
