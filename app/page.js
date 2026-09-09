import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import PublicHeader from "./components/PublicHeader";
import FeaturedPullCarousel from "./components/FeaturedPullCarousel";
import CardPhoto from "./components/CardPhoto";
import HomeStoryCarousel from "./components/HomeStoryCarousel";
import { getPublicPulls } from "./lib/publicPulls";
import { tcgs } from "./lib/catalog";

export const dynamic = "force-dynamic";

const cardBackImages = {
  yugioh: "/graphics/card-backs/yugioh-card-back-hq.webp",
  "magic-the-gathering": "/graphics/card-backs/mtg-card-back-hq.webp",
  "flesh-and-blood": "/graphics/card-backs/flesh-and-blood-card-back-hq.webp",
};

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function tcgLabel(slug) {
  if (slug === "yugioh") return "Yu-Gi-Oh!";
  if (slug === "magic-the-gathering") return "Magic: The Gathering";
  if (slug === "flesh-and-blood") return "Flesh and Blood";
  return "Trading card game";
}

export default async function Home() {
  const supabase = createPublicClient();
  const pulls = await getPublicPulls(supabase, 12);
  let oneRing = null;
  let darkMagician = null;

  if (supabase) {
    const [{ data: oneRingCards }, { data: darkMagicianCards }] = await Promise.all([
      supabase.from("cards").select("id, name, image_url, card_sets!inner(slug)")
        .eq("name", "The One Ring").eq("card_sets.slug", "lotr-original").limit(1),
      supabase.from("cards").select("id, name, image_url, card_sets!inner(slug)")
        .ilike("name", "Dark Magician%").eq("card_sets.slug", "magnificent-monsters").limit(1),
    ]);
    oneRing = oneRingCards?.[0] || null;
    darkMagician = darkMagicianCards?.[0] || null;
  }

  const stories = [
    {
      title: "Dark Magician",
      summary: "Yugi's signature monster became one of the defining cards of the original animated series.",
      image: pulls.find((pull) => pull.cardName.startsWith("Dark Magician"))?.imageUrl || darkMagician?.image_url,
      imageAlt: darkMagician?.name || "Dark Magician",
      imageClass: "yugioh-feature-background",
      href: darkMagician ? `/card/${darkMagician.id}` : "/sets/magnificent-monsters",
    },
    {
      title: "The One Ring 001/001",
      summary: "A single serialized copy became one of the best-known modern cards in the collecting world.",
      image: oneRing?.image_url || pulls.find((pull) => pull.cardName === "The One Ring")?.imageUrl,
      imageAlt: "The One Ring 001/001",
      href: oneRing ? `/card/${oneRing.id}` : "/sets/lotr-original",
    },
    {
      title: "The first Grand Master Rares",
      summary: "Magnificent Monsters introduced individually numbered versions of 18 reimagined Yu-Gi-Oh! cards.",
      imageClass: "yugioh-feature-background",
      href: "/sets/magnificent-monsters",
    },
    {
      title: "Magnificent Maestros",
      summary: "Preview the next Grand Master Rare registry ahead of the set's November 2026 release.",
      imageClass: "maestros-feature-background",
      href: "/sets/magnificent-maestros",
    },
  ];

  const featuredTcgs = ["yugioh", "magic-the-gathering", "flesh-and-blood"]
    .map((slug) => tcgs.find((tcg) => tcg.slug === slug))
    .filter(Boolean);
  const photoPulls = pulls.filter((pull) => pull.imageUrl);
  const featuredYugiohPulls = photoPulls.filter((pull) => pull.tcgSlug === "yugioh").slice(0, 8);
  const recentPulls = photoPulls.slice(0, 4);
  const galleryPulls = photoPulls.slice(0, 4);

  return (
    <main className="home-page">
      <PublicHeader />
      <section className="home-intro">
        <p className="home-section-eyebrow">The global serialised card registry</p>
        <h1>Find and track serialised cards</h1>
      </section>

      <FeaturedPullCarousel pulls={featuredYugiohPulls} />

      <section className="home-discoveries" aria-labelledby="recent-discoveries-title">
        <div className="home-section-heading">
          <h2 id="recent-discoveries-title">Recent discoveries</h2>
          <Link href="/gallery?sort=recent">View all recent pulls</Link>
        </div>
        {recentPulls.length ? (
          <div className="home-pull-row">
            {recentPulls.map((pull) => (
              <Link href={`/serial/${pull.serialId}`} className="home-pull-card" key={pull.id}>
                <span className="home-pull-photo">
                  <CardPhoto src={pull.imageUrl} crop={pull.displayCrop} alt={`${pull.cardName} serial ${pull.serialLabel}`} />
                </span>
                <strong>{pull.cardName}</strong>
                <small>{pull.serialLabel} · {tcgLabel(pull.tcgSlug)}</small>
              </Link>
            ))}
          </div>
        ) : <p className="home-empty-state">Newly confirmed pull photos will appear here.</p>}
      </section>

      <section className="home-explore" aria-labelledby="explore-registry-title">
        <div className="home-section-heading"><h2 id="explore-registry-title">Explore the registry</h2></div>
        <div className="home-tcg-row">
          {featuredTcgs.map((tcg) => (
            <Link href={`/tcg/${tcg.slug}`} className="home-tcg-card" key={tcg.slug}>
              <span className={`home-tcg-art home-tcg-art-${tcg.slug}`}>
                <span className="home-tcg-cardback">
                  <img src={cardBackImages[tcg.slug]} alt={`${tcg.name} card back`} />
                </span>
              </span>
              <span className="home-tcg-copy"><strong>{tcg.name}</strong><small>{tcg.description}</small></span>
            </Link>
          ))}
        </div>
      </section>

      <HomeStoryCarousel stories={stories} />

      <section className="home-pull-gallery" aria-labelledby="pull-gallery-title">
        <div className="home-section-heading home-gallery-heading">
          <div><p className="home-section-eyebrow">From the registry</p><h2 id="pull-gallery-title">Pull Gallery</h2></div>
          <Link href="/gallery">View the full gallery</Link>
        </div>
        {galleryPulls.length ? (
          <div className="home-gallery-row">
            {galleryPulls.map((pull, index) => (
              <Link href={`/gallery?pull=${pull.id}`} className={`home-gallery-photo detail-${index + 1}`} key={pull.id}>
                <CardPhoto src={pull.imageUrl} crop={pull.displayCrop} alt={`${pull.cardName} serial ${pull.serialLabel}`} loading="lazy" />
                <span>{pull.cardName} · {pull.serialLabel}</span>
              </Link>
            ))}
          </div>
        ) : <p className="home-empty-state">Confirmed pull photographs will appear here.</p>}
      </section>
    </main>
  );
}
