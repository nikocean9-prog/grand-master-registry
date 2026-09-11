const MAESTROS_IMAGES = {
  blueeyeswhitedragonthewhitephantombeast: "/catalog/magnificent-maestros/blue-eyes-white-dragon-white-phantom-beast.webp",
};

export function getMagnificentMaestrosCatalogImage(card) {
  const key = String(card?.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return MAESTROS_IMAGES[key] || card?.image_url || null;
}
