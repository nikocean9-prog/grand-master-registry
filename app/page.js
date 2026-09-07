import Link from "next/link";
import PublicHeader from "./components/PublicHeader";
import FeaturedGallery from "./components/FeaturedGallery";
import { createClient } from "@supabase/supabase-js";
import { tcgs } from "./lib/catalog";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export default async function Home() {
  const liveSets = tcgs.flatMap((tcg) => tcg.sets).filter((set) => set.status === "live");
  const liveTcgCount = tcgs.filter((tcg) => tcg.sets.some((set) => set.status === "live")).length;
  const { count: confirmedSerialCount, error: countError } = await supabase
    .from("serials")
    .select("*", { count: "exact", head: true })
    .eq("status", "confirmed");
  const serialCount = countError ? 0 : confirmedSerialCount || 0;
  const [{ data: oneRingCards }, { data: darkMagicianCards }] = await Promise.all([
    supabase
      .from("cards")
      .select("id, name, image_url, card_sets!inner(slug)")
      .eq("name", "The One Ring")
      .eq("card_sets.slug", "lotr-original")
      .limit(1),
    supabase
      .from("cards")
      .select("id, name, image_url, card_sets!inner(slug)")
      .ilike("name", "Dark Magician%")
      .eq("card_sets.slug", "magnificent-monsters")
      .limit(1),
  ]);
  const oneRing = oneRingCards?.[0];
  const darkMagician = darkMagicianCards?.[0];
  const features = [
    {
      label: "Magic: The Gathering · Unique serial",
      title: "The One Ring 001/001",
      shortTitle: "The One Ring",
      summary: "A single serialized copy was hidden within The Lord of the Rings: Tales of Middle-earth release.",
      facts: [
        "The only copy printed carries the serial number 001/001.",
        "It was found by Canadian collector Brook Trafton in June 2023.",
        "Post Malone purchased the card from Trafton later that year for a reported US$2 million.",
      ],
      image: oneRing?.image_url || "https://media.wizards.com/2023/images/daily/en_T2CA6K33JjSe.png",
      imageAlt: "The serialized The One Ring 001/001 Magic card",
      href: oneRing ? `/card/${oneRing.id}` : "/sets/lotr-original",
      linkLabel: "Open registry",
    },
    {
      label: "Yu-Gi-Oh! · Iconic card",
      title: "Dark Magician",
      shortTitle: "Dark Magician",
      summary: "Yugi's signature monster became one of the defining cards of the original animated series.",
      facts: [
        "Dark Magician appears in the opening episode, The Heart of the Cards.",
        "The opening episode pits Yugi against Seto Kaiba in a Duel Monsters showdown.",
        "Magnificent Monsters reimagines the character as Dark Magician, the Pharaoh's Servant.",
      ],
      image: darkMagician?.image_url,
      imageAlt: darkMagician?.name || "Dark Magician card",
      imageClass: darkMagician?.image_url ? "" : "yugioh-feature-background",
      href: darkMagician ? `/card/${darkMagician.id}` : "/sets/magnificent-monsters",
      linkLabel: "Open registry",
      sourceUrl: "https://www.yugioh.com/yu-gi-oh/the-heart-of-the-cards/210",
      sourceLabel: "Episode source",
    },
    {
      label: "Registry spotlight · Magnificent Monsters",
      title: "The first Grand Master Rares",
      shortTitle: "Grand Master Rares",
      summary: "A new Yu-Gi-Oh! rarity built around individually numbered versions of 18 reimagined anime cards.",
      facts: [
        "Each featured card has 100 Americas-distributed copies.",
        "A further 100 European-distributed copies carry an E suffix.",
        "That creates 3,600 numbered cards for the complete 18-card registry.",
      ],
      imageAlt: "Green and gold Magnificent Monsters registry artwork",
      imageClass: "yugioh-feature-background",
      href: "/sets/magnificent-monsters",
      linkLabel: "Explore the set",
      sourceUrl: "https://www.yugioh-card.com/eu/product/magnificent-monsters/",
      sourceLabel: "Official set details",
    },
  ];

  return (
    <main>
      <PublicHeader />
      <section className="compact-home-intro">
        <p className="eyebrow">The global serialised card registry</p>
        <h1>Find and track serialised cards</h1>
        <p>
          Explore community-built registries for serial-numbered trading cards,
          organised by trading card game and set.
        </p>
      </section>
      <section className="compact-stats" aria-label="Registry overview"><div><strong>{liveTcgCount}</strong><span>Live TCGs</span></div><div><strong>{liveSets.length}</strong><span>Live sets</span></div><div><strong>{serialCount.toLocaleString()}</strong><span>Serials found</span></div></section>
      <FeaturedGallery features={features} />
      <section className="home-links single"><Link href="/help" className="feature-link"><span>?</span><div><h2>Help &amp; Contact</h2><p>Get help, report a problem, or suggest a TCG or set.</p></div></Link></section>
    </main>
  );
}
