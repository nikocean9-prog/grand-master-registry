// Official-source observations only. Missing records are never treated as zero.
// Europe-distributed /100E English GMR records are NOT all-region totals.
import { brothersWarBgs, BRO_BGS_SOURCE } from "./brothersWarBgs";

const officialBgs = {
  2: {
    tcg: "yugioh", set: "magnificent-monsters", serialTotal: 200,
    region: "Europe-distributed /100E only", summary: "English GMR",
    printing: "2026 Magnificent Monsters 1st Edition · serial-numbered Grand Master Rare",
    name: "Kuriboh - Multiply!",
    cardNumber: "MAMO-EN002",
    source: "https://beckett.com/grading/pop-report/list-of-cards?type=card&page=1&limit=100&query=2026+Yu-Gi-Oh%21+TCG+Magnificent+Monsters+1st+Edition+%23MAMOEN002+Kuriboh+-+Multiply%21+EXT+ART+SERIAL+GMR%2F100E&sports=YuGiOh",
    observedDate: "24 October 2026",
    gemMint95: 1,
  },
  3: {
    tcg: "yugioh", set: "magnificent-monsters", serialTotal: 200,
    region: "Europe-distributed /100E only", summary: "English GMR",
    printing: "2026 Magnificent Monsters 1st Edition · serial-numbered Grand Master Rare",
    name: "Dark Magical Curtain",
    cardNumber: "MAMO-EN003",
    source: "https://beckett.com/grading/pop-report/list-of-cards?type=card&page=1&limit=100&query=2026+Yu-Gi-Oh%21+TCG+Magnificent+Monsters+1st+Edition+%23MAMOEN003+Dark+Magical+Curtain+EXT+ART+SERIAL+GMR%2F100E&sports=YuGiOh",
    observedDate: "24 October 2026",
    gemMint95: 4,
    previous: { total: 3, gemMint95: 3, observedDate: "17 October 2026" },
  },
  91: {
    tcg: "magic-the-gathering", set: "mtg-final-fantasy", serialTotal: 77,
    name: "Golden Traveling Chocobo", cardNumber: "0551f",
    region: "Global /77", summary: "English · serialized Golden Chocobo",
    printing: "2025 FINAL FANTASY · 0551f · serialized gold foil /77",
    source: "https://beckett.com/grading/pop-report/list-of-cards?type=card&page=1&limit=100&query=2025+Magic+The+Gathering+Final+Fantasy+%230551f+Traveling+Chocobo+GOLD+FOIL+M&sports=Magic+The+Gathering",
    identitySource: "https://magic.wizards.com/en/news/feature/collecting-final-fantasy",
    observedDate: "24 October 2026",
    gemMint95: 8, mint9: 9, nearMintMint85: 1,
  },
};

export function getOfficialBgsPopulation(card) {
  const bro = brothersWarBgs.find(row => row.id === Number(card.id));
  const entry = officialBgs[Number(card.id)] || (bro && {
    ...bro, tcg: "magic-the-gathering", set: "the-brothers-war", serialTotal: 500,
    region: "Global /500", summary: "English · serialized schematic rainbow foil",
    printing: "2022 The Brothers' War Retro Artifacts · serialized schematic rainbow foil /500",
    source: BRO_BGS_SOURCE,
    identitySource: "https://magic.wizards.com/en/news/feature/whats-inside-the-brothers-war-boosters",
  });
  if (!entry || card.name !== entry.name || card.card_sets?.tcg_slug !== entry.tcg || card.card_sets?.slug !== entry.set || Number(card.serial_total) !== entry.serialTotal) return null;
  const counts = entry.gradeCounts || [0, 0, entry.gemMint95, entry.mint9 ?? 0, entry.nearMintMint85 ?? 0, ...Array(15).fill(0)];
  const labels = ["9.5", "9", "8.5", "8", "7.5", "7", "6.5", "6", "5.5", "5", "4.5", "4", "3.5", "3", "2.5", "2", "1.5", "1"];
  const grades = Object.fromEntries(labels.map((grade, i) => [grade, counts[i + 2]]));
  return {
    ...entry,
    observedDate: entry.observedDate || "24 October 2026",
    language: "English",
    blackLabel10: counts[0],
    pristine10: counts[1],
    gemMint95: counts[2],
    grades,
    extraGrades: labels.filter(grade => grade !== "9.5" && grades[grade] > 0).map(grade => ({ grade, count: grades[grade] })),
    otherBgs: 0,
    total: counts.reduce((sum, count) => sum + count, 0),
    previous: entry.previous || null,
  };
}
