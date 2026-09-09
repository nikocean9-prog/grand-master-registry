export const wikiArticles = [
  {
    slug: "dark-magician",
    category: "Yu-Gi-Oh! · Character profile",
    title: "Dark Magician",
    summary: "The signature monster that became inseparable from Yugi and the original Yu-Gi-Oh! series.",
    image: "/graphics/magnificent-monsters-tile.jpg",
    sections: [
      {
        heading: "A defining Yu-Gi-Oh! character",
        paragraphs: [
          "Dark Magician is Yugi's signature monster and one of the most recognisable characters in Yu-Gi-Oh!. Its repeated appearances in decisive duels made the card part of the identity of the original animated series.",
          "Many versions of Dark Magician have been released across different products, artworks and rarities. That long history has made the character an important focus for collectors as well as players.",
        ],
      },
      {
        heading: "The Grand Master Rare",
        paragraphs: [
          "Magnificent Monsters reimagines the character as Dark Magician, the Pharaoh's Servant. Each Grand Master Rare carries an individual serial number, allowing every confirmed copy to be recorded separately in the registry.",
        ],
      },
    ],
  },
  {
    slug: "the-one-ring",
    category: "Magic: The Gathering · Card profile",
    title: "The One Ring 001/001",
    summary: "The unique serialized card that became one of the most widely followed modern trading-card discoveries.",
    image: "/graphics/card-backs/mtg-card-back-full.webp",
    sections: [
      {
        heading: "A genuinely unique card",
        paragraphs: [
          "The serialized 001/001 version of The One Ring was produced as a single card. Its discovery drew attention well beyond regular Magic: The Gathering collectors and demonstrated how a numbered card can create a documented collecting event.",
        ],
      },
      {
        heading: "Why it matters to the registry",
        paragraphs: [
          "Most serialized releases contain a run of numbered copies. The One Ring sits at the extreme end of that idea: one known number and one possible discovery. It remains an important reference point in the history of modern serialized cards.",
        ],
      },
    ],
  },
  {
    slug: "grand-master-rares",
    category: "Yu-Gi-Oh! · Registry guide",
    title: "Grand Master Rares",
    summary: "How individually numbered Yu-Gi-Oh! cards are organised, identified and tracked in the registry.",
    image: "/graphics/yugioh-tile-bg.webp",
    sections: [
      {
        heading: "What is a Grand Master Rare?",
        paragraphs: [
          "Grand Master Rares are individually numbered Yu-Gi-Oh! cards. The printed serial distinguishes one copy from every other copy in the same release, which means each card can be tracked as its own registry entry.",
        ],
      },
      {
        heading: "How discoveries are recorded",
        paragraphs: [
          "A discovery is supported by a photograph showing the card and its printed number. Confirmed submissions are then connected to the correct card, set, number and region while the original evidence photograph is preserved.",
        ],
      },
    ],
  },
];

export function getWikiArticle(slug) {
  return wikiArticles.find((article) => article.slug === slug) || null;
}
