// Edited catalogue illustration only. Never apply this to submission/evidence photos.
export function getGundamCatalogImage(card) {
  return Number(card.id) === 548
    ? "/graphics/gundam-strike-freedom-exbp-028-catalog.webp"
    : card.image_url;
}
