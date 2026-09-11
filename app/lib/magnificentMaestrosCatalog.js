const MAESTROS_IMAGES = {
  blueeyeswhitedragonthewhitephantombeast: "/catalog/magnificent-maestros/blue-eyes-white-dragon-white-phantom-beast.webp",
  deepeyeswhitedragontheblueabyss: "/catalog/magnificent-maestros/deep-eyes-white-dragon-blue-abyss.webp",
  theguidingfluteofsummoningdragons: "/catalog/magnificent-maestros/the-guiding-flute-of-summoning-dragons.webp",
  cyberenddragonthefinalstrikedragon: "/catalog/magnificent-maestros/cyber-end-dragon-final-strike-dragon.webp",
  cyberdragontheluminousmechdragon: "/catalog/magnificent-maestros/cyber-dragon-luminous-mech-dragon.webp",
  futurefusionnova: "/catalog/magnificent-maestros/future-fusion-nova.webp",
  crimsondragonquetzalcoatl: "/catalog/magnificent-maestros/crimson-dragon-quetzalcoatl.webp",
  rednovadragonburningsoul: "/catalog/magnificent-maestros/red-nova-dragon-burning-soul.webp",
  reddragonarchfiendschains: "/catalog/magnificent-maestros/red-dragon-archfiends-chains.webp",
  neogalaxyeyesphotondragonphotonhowling: "/catalog/magnificent-maestros/neo-galaxy-eyes-photon-dragon-photon-howling.webp",
  galaxyeyesphotonchangedragon: "/catalog/magnificent-maestros/galaxy-eyes-photon-change-dragon.webp",
  galaxydefenserobotorbital7: "/catalog/magnificent-maestros/galaxy-defense-robot-orbital-7.webp",
  starvingvenomfusiondragonfourheavenlydragons: "/catalog/magnificent-maestros/starving-venom-fusion-dragon-four-heavenly-dragons.webp",
  starvingvenomfusiondragonofthefourheavenlydragons: "/catalog/magnificent-maestros/starving-venom-fusion-dragon-four-heavenly-dragons.webp",
  clearwingsynchrodragonfourheavenlydragons: "/catalog/magnificent-maestros/clear-wing-synchro-dragon-four-heavenly-dragons.webp",
  clearwingsynchrodragonofthefourheavenlydragons: "/catalog/magnificent-maestros/clear-wing-synchro-dragon-four-heavenly-dragons.webp",
  darkrebellionxyzdragonfourheavenlydragons: "/catalog/magnificent-maestros/dark-rebellion-xyz-dragon-four-heavenly-dragons.webp",
  darkrebellionxyzdragonofthefourheavenlydragons: "/catalog/magnificent-maestros/dark-rebellion-xyz-dragon-four-heavenly-dragons.webp",
  borreloadliberatordragon: "/catalog/magnificent-maestros/borreload-liberator-dragon.webp",
  rokketbarrage: "/catalog/magnificent-maestros/rokket-barrage.webp",
  tripleborrellaunch: "/catalog/magnificent-maestros/triple-borrel-launch.webp",
};

export function getMagnificentMaestrosCatalogImage(card) {
  const key = String(card?.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return MAESTROS_IMAGES[key] || card?.image_url || null;
}
