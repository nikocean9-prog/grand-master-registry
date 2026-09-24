// Edited catalogue illustration only. Never apply this to submission/evidence photos.
const PHOTO_CATALOGUE = {
  652: "goku-clean.webp#crop=8,6,1045,1471,1061,1483",
  664: "chrono-original.webp#patch=/graphics/catalogue-photos/chrono-clean.webp,3,285,143,66,350,510",
  665: "messiah-original.webp#patch=/graphics/catalogue-photos/messiah-clean.webp,5,285,139,66,350,510",
  651: "bardock-photo.webp#quad=226,298,981,317,970,1373,206,1371,1200,1600",
  653: "broly-photo.webp#quad=289,463,878,463,861,1265,296,1267,1154,1600",
  654: "gohan-photo.webp#quad=335,565,914,561,959,1485,287,1463,1200,1600",
  655: "vegeta-photo.webp#quad=41,175,338,174,339,591,43,588,380,638",
};

export function getGundamCatalogImage(card) {
  if (PHOTO_CATALOGUE[Number(card.id)]) return `/graphics/catalogue-photos/${PHOTO_CATALOGUE[Number(card.id)]}`;
  if (card.name === "Portgas.D.Ace (Serial Numbered)") return "/graphics/one-piece-ace-catalog-clean.webp";
  if (Number(card.id) === 561) return "/graphics/universus-kirishima-chrome-catalog.webp";
  if (Number(card.id) === 547) return "/graphics/digimon-omnimon-bt13-112-catalog.webp";
  return Number(card.id) === 548
    ? "/graphics/gundam-strike-freedom-exbp-028-catalog.webp"
    : card.image_url;
}
