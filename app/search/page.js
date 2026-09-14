import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import PublicHeader from "../components/PublicHeader";
import { tcgs } from "../lib/catalog";
import { formatSerialLabel } from "../lib/publicPulls";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search the Registry | TCG Serial Tracker",
  description: "Search serialised cards, sets and confirmed serial numbers.",
};

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
}

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = String(params?.q || "").trim().slice(0, 80);
  const supabase = publicClient();
  let cards = [];
  let serials = [];

  if (query && supabase) {
    const serialMatch = query.match(/^(\d{1,4})(e)?$/i);
    const cardRequest = supabase
      .from("cards")
      .select("id,name,image_url,card_sets(name,slug,tcg_slug)")
      .ilike("name", `%${query.replace(/[%_]/g, "")}%`)
      .limit(24);
    const serialRequest = serialMatch
      ? supabase
        .from("serials")
        .select("id,serial_number,region,status,card:cards(name,card_sets(name,tcg_slug))")
        .eq("serial_number", Number(serialMatch[1]))
        .eq("region", serialMatch[2] ? "E" : "AMERICAS")
        .eq("status", "confirmed")
        .limit(24)
      : Promise.resolve({ data: [] });
    const [cardResult, serialResult] = await Promise.all([cardRequest, serialRequest]);
    cards = cardResult.data || [];
    serials = serialResult.data || [];
  }

  const sets = query
    ? tcgs.flatMap((tcg) => tcg.sets.map((set) => ({ ...set, tcgName: tcg.name })))
      .filter((set) => set.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 12)
    : [];
  const hasResults = cards.length || serials.length || sets.length;

  return (
    <main className="search-page">
      <PublicHeader />
      <Link href="/" className="back-link">← Back to Home</Link>
      <header className="search-page-heading">
        <p className="home-section-eyebrow">Registry search</p>
        <h1>Find a card, set or serial</h1>
        <form className="home-registry-search search-page-form" action="/search" method="get" role="search">
          <span className="home-registry-search-icon" aria-hidden="true" />
          <input name="q" type="search" defaultValue={query} placeholder="Search card, set or serial" aria-label="Search card, set or serial" autoFocus />
          <button type="submit">Search</button>
        </form>
      </header>

      {query && !hasResults && <p className="home-empty-state">No registry results found for “{query}”.</p>}
      {cards.length > 0 && <section className="search-results"><h2>Cards</h2><div>{cards.map((card) => <Link href={`/card/${card.id}`} key={card.id}><strong>{card.name}</strong><small>{card.card_sets?.name}</small></Link>)}</div></section>}
      {sets.length > 0 && <section className="search-results"><h2>Sets</h2><div>{sets.map((set) => <Link href={set.href || `/sets/${set.slug}`} key={set.slug}><strong>{set.name}</strong><small>{set.tcgName}</small></Link>)}</div></section>}
      {serials.length > 0 && <section className="search-results"><h2>Confirmed serials</h2><div>{serials.map((serial) => <Link href={`/serial/${serial.id}`} key={serial.id}><strong>{serial.card?.name}</strong><small>{formatSerialLabel(serial)} · {serial.card?.card_sets?.name}</small></Link>)}</div></section>}
    </main>
  );
}
