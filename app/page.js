import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import PublicHeader from "./components/PublicHeader";
import CardPhoto from "./components/CardPhoto";
import HomeStoryCarousel from "./components/HomeStoryCarousel";
import HomeFeaturedSet from "./components/HomeFeaturedSet";
import { getPublicPulls } from "./lib/publicPulls";
import { tcgs } from "./lib/catalog";
import { getMagnificentMonstersCatalogImage } from "./lib/magnificentMonstersCatalog";

export const dynamic = "force-dynamic";

const featuredPullSelection = [
  { card: "stardustdragonvictimsanctuary", serial: "010" },
  { card: "wingedkuribohsabatiellv10", serial: "090E" },
  { card: "favoriteheroflamewingman", serial: "086" },
];

const cardBackImages = {
  yugioh: "/graphics/card-backs/yugioh-card-back-v2.webp",
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

function normalizedCardName(name = "") {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function selectFeaturedPulls(pulls) {
  const selected = [];
  const usedCards = new Set();

  for (const wanted of featuredPullSelection) {
    const candidates = pulls.filter((pull) => (
      pull.setSlug === "magnificent-monsters"
      && normalizedCardName(pull.cardName) === wanted.card
      && pull.imageUrl
      && pull.displayCrop
      && !usedCards.has(pull.cardId)
    ));
    const match = candidates.find((pull) => pull.serialLabel === wanted.serial) || candidates[0];
    if (!match) continue;
    usedCards.add(match.cardId);
    selected.push(match);
  }

  return selected;
}

export default async function Home() {
  const supabase = createPublicClient();
  const [pulls, magnificentMonstersPulls] = await Promise.all([
    getPublicPulls(supabase, 24),
    getPublicPulls(supabase, 200, { setSlug: "magnificent-monsters" }),
  ]);
  let oneRing = null;
  let darkMagician = null;
  let confirmedSerials = [];
  let confirmedMagnificentMonsterSerials = 0;

  if (supabase) {
    const [{ data: oneRingCards }, { data: darkMagicianCards }, { data: confirmedData }, { data: magnificentMonsterSet }] = await Promise.all([
      supabase.from("cards").select("id, name, image_url, card_sets!inner(slug)")
        .eq("name", "The One Ring").eq("card_sets.slug", "lotr-original").limit(1),
      supabase.from("cards").select("id, name, image_url, card_sets!inner(slug)")
        .ilike("name", "Dark Magician%").eq("card_sets.slug", "magnificent-monsters").limit(1),
      supabase.from("serials").select("card_id, card:cards(id, name, image_url, serial_total, card_sets(slug))")
        .eq("status", "confirmed"),
      supabase.from("card_sets").select("id").eq("slug", "magnificent-monsters").eq("status", "live").single(),
    ]);
    oneRing = oneRingCards?.[0] || null;
    darkMagician = darkMagicianCards?.[0] || null;
    confirmedSerials = confirmedData || [];

    if (magnificentMonsterSet?.id) {
      const { data: magnificentMonsterCards } = await supabase
        .from("cards")
        .select("serials(status)")
        .eq("set_id", magnificentMonsterSet.id);
      confirmedMagnificentMonsterSerials = magnificentMonsterCards?.reduce(
        (total, card) => total + (card.serials?.filter((serial) => serial.status === "confirmed").length || 0),
        0
      ) || 0;
    }
  }

  const discoveriesByCard = confirmedSerials.reduce((totals, serial) => {
    if (!serial.card?.id) return totals;
    if (!totals[serial.card.id]) totals[serial.card.id] = { card: serial.card, count: 0 };
    totals[serial.card.id].count += 1;
    return totals;
  }, {});
  const milestone = Object.values(discoveriesByCard)
    .map((entry) => ({ ...entry, percent: Math.floor((entry.count / Number(entry.card.serial_total || 100)) * 100) }))
    .filter((entry) => entry.percent >= 10)
    .sort((a, b) => b.percent - a.percent)[0] || null;

  const stories = [
    {
      kicker: "Card Wiki",
      title: "Dark Magician",
      summary: "Yugi's signature monster became one of the defining cards of the original animated series.",
      image: darkMagician
        ? getMagnificentMonstersCatalogImage(darkMagician)
        : "/catalog/magnificent-monsters/dark-magician-pharaohs-servant.webp",
      imageAlt: darkMagician?.name || "Dark Magician",
      imageClass: "yugioh-feature-background",
      imageDisplay: "contain",
      href: "/wiki/dark-magician",
      actionLabel: "Read the article",
    },
    {
      kicker: "Card Wiki",
      title: "The One Ring 001/001",
      summary: "A single serialized copy became one of the best-known modern cards in the collecting world.",
      image: oneRing?.image_url || pulls.find((pull) => pull.cardName === "The One Ring")?.imageUrl,
      imageAlt: "The One Ring 001/001",
      href: "/wiki/the-one-ring",
      actionLabel: "Read the article",
    },
    {
      kicker: "Registry Guide",
      title: "The first Grand Master Rares",
      summary: "Magnificent Monsters introduced individually numbered versions of 18 reimagined Yu-Gi-Oh! cards.",
      imageClass: "yugioh-feature-background",
      href: "/wiki/grand-master-rares",
      actionLabel: "Read the guide",
    },
    {
      kicker: "Upcoming Release",
      title: "Magnificent Maestros",
      summary: "Preview the next Grand Master Rare registry ahead of the set's November 2026 release.",
      image: "/magnificent-maestros-wordmark-v4.png",
      imageAlt: "Magnificent Maestros",
      imageClass: "yugioh-feature-background",
      imageDisplay: "contain",
      href: "/sets/magnificent-maestros",
      actionLabel: "Preview the set",
    },
    ...(milestone ? [{
      kicker: "Registry Milestone",
      title: `${milestone.percent}% of ${milestone.card.name} discovered`,
      summary: `${milestone.count} individually numbered copies have now been confirmed by the registry.`,
      image: milestone.card.image_url,
      imageAlt: milestone.card.name,
      imageClass: "yugioh-feature-background",
      href: `/card/${milestone.card.id}`,
      actionLabel: "View the card",
    }] : []),
  ];

  const featuredTcgs = ["yugioh", "magic-the-gathering", "flesh-and-blood"]
    .map((slug) => tcgs.find((tcg) => tcg.slug === slug))
    .filter(Boolean);
  const photoPulls = pulls.filter((pull) => pull.imageUrl);
  const featuredSetPulls = selectFeaturedPulls(magnificentMonstersPulls);
  const recentPulls = photoPulls.slice(0, 4);

  return (
    <main className="home-page">
      <PublicHeader />
      <section className="home-registry-hero">
        <div className="home-registry-hero-copy">
          <p className="home-section-eyebrow">The global serialised card registry</p>
          <h1><span>Tracking every serial.</span><span>Preserving every pull.</span></h1>
          <p className="home-registry-hero-summary">Search, explore and contribute to the global registry of serialised trading cards.</p>
          <form className="home-registry-search" action="/search" method="get" role="search">
            <span className="home-registry-search-icon" aria-hidden="true" />
            <input name="q" type="search" placeholder="Search card, set or serial" aria-label="Search card, set or serial" />
            <button type="submit">Search</button>
          </form>
        </div>
        <div className="home-registry-visual" aria-hidden="true">
          <span className="home-registry-hero-card">
            <img
              src="/catalog/magnificent-monsters/stardust-dragon-victim-sanctuary.webp"
              alt=""
            />
          </span>
          <div className="home-registry-stats">
            <span><strong>{tcgs.filter((tcg) => tcg.status === "live").length}</strong> TCGs</span>
            <span><strong>{tcgs.flatMap((tcg) => tcg.sets).filter((set) => set.status === "live").length}</strong> sets</span>
            <span><strong>{tcgs.flatMap((tcg) => tcg.sets).filter((set) => set.status === "live").reduce((sum, set) => sum + Number(set.serials || 0), 0).toLocaleString()}</strong> tracked</span>
          </div>
        </div>
      </section>

      <HomeFeaturedSet pulls={featuredSetPulls} confirmed={confirmedMagnificentMonsterSerials} />

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
    </main>
  );
}
