// Reviewed English serial-numbered Grand Master Rare snapshot only.
// Regional Grand Master Rare and Grand Master Rare-Europe rows are combined.
// GemRate's unlabelled grade bucket is not assumed to be a numerical grade.
export const PSA_SOURCE = "https://www.gemrate.com/item-details?category=tcg-cards&grader=psa&set_name=YU-GI-Oh%21+Mamo-Magnificent+Monsters&year=2026";
export const PSA_OBSERVED_DATE = "7 October 2026";

const rows = [
  ["darkmagicianthepharaohsservant", 3, 0, 0, 3],
  ["kuribohmultiply", 8, 0, 0, 8],
  ["darkmagicalcurtain", 11, 0, 0, 11],
  ["favoriteheroshiningflarewingman", 5, 0, 0, 5],
  ["favoriteheroflamewingman", 1, 0, 0, 1],
  ["wingedkuribohsabatiellv10", 4, 0, 0, 4],
  ["stardustdragonvictimsanctuary", 7, 0, null, 8, 1],
  ["starjunksynchron", 4, 0, 0, 4],
  ["synchroemergency", 2, 1, 0, 3],
  ["number39utopiaemissaryoflight", 4, 0, 0, 4],
  ["gagagamagiciangagagamagic", 1, 1, 0, 2],
  ["gagagagirlcellphonesubtraction", 2, 1, 0, 3],
  ["oddeyespendulumdragonfourheavenlydragons", 2, 0, 0, 2],
  ["horoscopesorcererthestargazermagician", 2, 0, 0, 2],
  ["astrographsorcererthestarfrostmagician", 1, 0, 0, 1],
  ["decodetalkerintegration", 1, 0, 0, 1],
  ["cybersecontractwitch", 3, 0, 0, 3],
];

export function getPsaPopulation(card) {
  if (card.card_sets?.slug !== "magnificent-monsters") return null;
  const name = card.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const row = rows.find(([key]) => key === name);
  if (!row) return null;
  const [, psa10, psa9, psa8AndBelow, total, unconfirmed = 0] = row;
  return { psa10, psa9, psa8AndBelow, total, unconfirmed };
}
