import CatalogCardArt from "./CatalogCardArt";

// Fit the visible mark, not the padded canvas supplied by the publisher/store.
// These viewports leave the original logo pixels and proportions unchanged.
const LOGO_PRESENTATION = {
  "neopets-battledome": { crop: "150,20,1300,524,1600,564" },
  "one-piece": { crop: "0,0,600,160,600,160" },
  "dragon-ball-super": {
    src: "https://www.pngkey.com/png/detail/42-428156_comments-dragon-ball-super-card-game-logo.png",
    crop: "178,37,468,232,820,306",
  },
  altered: { crop: "50,596,3458,1202,3508,2480" },
  "cardfight-vanguard": { crop: "0,332,1200,536,1200,1200" },
  riftbound: {
    src: "https://spellboundgames.co.uk/cdn/shop/collections/riftlogo.png?v=1743736584&width=1500",
    crop: "106,324,788,353,1000,1000",
  },
};

export default function TcgLogo({ slug, src, alt, className = "" }) {
  const presentation = LOGO_PRESENTATION[slug];
  if (!presentation) return <img src={src} alt={alt} className={className || undefined} />;
  return <CatalogCardArt preserveAspectRatio="xMidYMid meet" src={`${presentation.src || src}#crop=${presentation.crop}`} alt={alt} className={`tcg-logo-normalised tcg-logo--${slug} ${className}`} />;
}
