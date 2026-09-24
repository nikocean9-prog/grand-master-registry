# Registry branding sources — September 21, 2026

The four additional game directories share the approved Magic directory layout. Existing game order, card records, serial totals and approval state are preserved.

## Official source assets

Five Star Wars set wordmarks are direct publisher PNGs converted to WebP with alpha preserved:

- Jump to Lightspeed: https://cdn.starwarsunlimited.com//SWH_04en_Logo_8e5408a592.png
- Legends of the Force: https://cdn.starwarsunlimited.com//SWH_05_Logo_EN_5ae290dc7d.png
- Secrets of Power: https://cdn.starwarsunlimited.com//Secrets_of_Power_Logo_EN_33306066e0.png
- A Lawless Time: https://cdn.starwarsunlimited.com//SWH_07_Logo_EN_126c1cc79e.png
- Ashes of the Empire: https://cdn.starwarsunlimited.com//SWH_ASH_Logo_EN_eb103cdbf3.png

## Source-based image edits

These are AI-assisted cutouts/restorations, not untouched publisher logo files. Built-in image generation was used, followed by WebP conversion with alpha preserved. Prompts requested exact lettering, colors, arrangement and transparent backgrounds, with other banner/packaging elements removed.

- Dusk till Dawn: isolated and straightened from publisher product box: https://cdn.fabtcg.com/uploads/2025/07/dtd_booster_dropshadow.webp
- Gundam 1st Anniversary: upper-left emblem isolated from https://www.gundam-gcg.com/gcg/bccard/en/news/2026/08/03/jk4RewgkniAiZnlE/1st-Anniversary-GCG-Web-banner.webp
- World Convergence: red/gold set wordmark isolated from https://world.digimoncard.com/images/products/pack/ver21/point/pc/mv.jpg?250404-2
- Gundam game logo: crisp black transparent restoration of low-resolution publisher header https://www.gundam-gcg.com/en/images/common/logo.png

Set files: `public/graphics/new-set-wordmarks/*-transparent.webp`; restored game logo: `public/graphics/gundam-logo-restored.webp`.

The Digimon catalogue description was corrected from Special Booster Ver. 2.0 to World Convergence (BT-21), consistent with https://world.digimoncard.com/products/pack/ver21/ . No database changes were made.

## Gundam card presentation — September 23, 2026

- `gundam-strike-freedom-exbp-028-catalog.webp`: built-in image edit of the existing official SAMPLE catalogue image, removing the diagonal SAMPLE overlay and isolating rounded card corners. Placeholder 000/000 preserved. Edited catalogue illustration only; submission/evidence files and approval records are unchanged.
- `card-backs/gundam-card-back.webp`: built-in image extraction/restoration of the publisher's frontmost card back from https://www.gundam-gcg.com/en/images/welcome/playguide/img_01.webp . Prompt preserves the pale-blue geometric design and lettering, removes the stack/background, and adds transparent physical corners.
- Shared `SerialGrid` behavior is enabled by the Gundam card-back mapping, including reduced-motion handling. Local confirmed-tile fixture triggered the existing flight/spin element successfully; the real Gundam registry has no confirmed pulls yet. Fixture exists only in the separate preview checkout.
- Production build and diff whitespace checks passed. Catalogue image override is restricted to card 548.

Omnimon BT13-112 catalogue edit (23 September 2026): AI-assisted SAMPLE removal and transparent card cutout derived from owner screenshot of official preview https://world.digimoncard.com/images/products/pack/ver21/card/BT13-112p.png?250404-2 . Catalogue illustration only; never submission evidence. Asset: public/graphics/digimon-omnimon-bt13-112-catalog.webp.

Grand Archive serial card back: official homepage image https://www.gatcg.com/_nuxt/img/back.d4a22a4.jpg (23 September 2026).

UniVersus legacy blue-lightning card back (23 September 2026): AI-assisted perspective correction and transparent catalogue cutout from https://i.ebayimg.com/images/g/WegAAOSw0VZmoUzN/s-l1600.jpg . Legacy era cross-checked against https://cardgamer.com/games/tcgs/universus/universus-card-back-design/ . UI illustration only, never evidence.

Kirishima Heroes Clash Chrome Rare catalogue illustration (23 September 2026): owner-approved AI restoration based on https://www.bigorbitcards.co.uk/510665-large_default/eijiro-kirishima-serial-numbered-1st-edition.jpg and adjacent Heroes Clash catalogue style references. Final haze-free revision; catalogue only, not serial evidence. Asset: public/graphics/universus-kirishima-chrome-catalog.webp.

## Weiß Schwarz card back
Shared by Saekano and Sword Art Online serialised registries. Source: https://en.wikipedia.org/wiki/File:Wei%C3%9F_Schwarz_cardback.png (Bushiroad card back). Original external PNG used for serial tiles and shared spin transition.

## Expansion logo presentation — 24 September 2026
Dragon Ball uses the higher-resolution original wordmark at https://www.pngkey.com/png/detail/42-428156_comments-dragon-ball-super-card-game-logo.png . Its neutral outer background is removed visually by CSS compositing; the source bitmap is unchanged. Altered and Vanguard padded transparent canvases are fitted with SVG viewports. Riftbound uses the transparent wordmark at https://spellboundgames.co.uk/cdn/shop/collections/riftlogo.png?v=1743736584&width=1500 . Shared `TcgLogo` presentation is used on the game list, game headers and set headers.
