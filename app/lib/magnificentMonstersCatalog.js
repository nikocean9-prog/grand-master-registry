const catalogImageOverrides = {
  darkmagicianthepharaohsservant: "/catalog/magnificent-monsters/dark-magician-pharaohs-servant.webp",
  kuribohmultiply: "/catalog/magnificent-monsters/kuriboh-multiply.webp",
  darkmagicalcurtain: "/catalog/magnificent-monsters/dark-magical-curtain.webp",
  favoriteheroshiningflarewingman: "/catalog/magnificent-monsters/favorite-hero-shining-flare-wingman.webp",
  favoriteheroflamewingman: "/catalog/magnificent-monsters/favorite-hero-flame-wingman.webp",
  wingedkuribohsabatiellv10: "/catalog/magnificent-monsters/winged-kuriboh-sabatiel-lv10.webp",
  stardustdragonvictimsanctuary: "/catalog/magnificent-monsters/stardust-dragon-victim-sanctuary.webp",
  starjunksynchron: "/catalog/magnificent-monsters/starjunk-synchron.webp",
  synchroemergency: "/catalog/magnificent-monsters/synchro-emergency.webp",
  number39utopiaemissaryoflight: "/catalog/magnificent-monsters/number-39-utopia-emissary-of-light.webp",
  gagagamagiciangagagamagic: "/catalog/magnificent-monsters/gagaga-magician-gagaga-magic.webp",
  gagagagirlcellphonesubtraction: "/catalog/magnificent-monsters/gagaga-girl-cell-phone-subtraction.webp",
  oddeyespendulumdragonfourheavenlydragons: "/catalog/magnificent-monsters/odd-eyes-pendulum-dragon-four-heavenly-dragons.webp",
  horoscopesorcererthestargazermagician: "/catalog/magnificent-monsters/horoscope-sorcerer-stargazer-magician.webp",
  astrographsorcererthestarfrostmagician: "/catalog/magnificent-monsters/astrograph-sorcerer-starfrost-magician.webp",
  decodetalkerintegration: "/catalog/magnificent-monsters/decode-talker-integration.webp",
  cybersecodemagician: "/catalog/magnificent-monsters/cyberse-code-magician.webp",
  cybersecontractwitch: "/catalog/magnificent-monsters/cyberse-contract-witch.webp",
};

export function getMagnificentMonstersCatalogImage(card) {
  const normalizedName = card.name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return catalogImageOverrides[normalizedName] || card.image_url;
}
