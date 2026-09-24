// Edited catalogue illustration only. Never apply this to submission/evidence photos.
export function getGundamCatalogImage(card) {
  if (card.name === "Portgas.D.Ace (Serial Numbered)") return "/graphics/one-piece-ace-catalog-clean.webp";
  if (Number(card.id) === 561) return "/graphics/universus-kirishima-chrome-catalog.webp";
  if (Number(card.id) === 547) return "/graphics/digimon-omnimon-bt13-112-catalog.webp";
  return Number(card.id) === 548
    ? "/graphics/gundam-strike-freedom-exbp-028-catalog.webp"
    : card.image_url;
}
