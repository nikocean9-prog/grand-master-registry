import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import PublicHeader from "../../components/PublicHeader";
import { getMagnificentMonstersCatalogImage } from "../../lib/magnificentMonstersCatalog";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Magnificent Monsters Grand Master Rare Serial Number Tracker",
  description: "Track all 3,600 serialised Yu-Gi-Oh! Magnificent Monsters Grand Master Rare cards, confirmed pulls and Americas or European E-region serial numbers.",
  alternates: { canonical: "/sets/magnificent-monsters" },
};

export default async function MagnificentMonstersPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: cardSet, error: setError } = await supabase.from("card_sets").select("id").eq("slug", "magnificent-monsters").eq("status", "live").single();
  const { data: cards, error: cardsError } = cardSet ? await supabase.from("cards").select(`id, name, image_url, serials ( status )`).eq("set_id", cardSet.id).order("id") : { data: [], error: setError };
  const confirmed = cards?.reduce((total, card) => total + (card.serials?.filter((serial) => serial.status === "confirmed").length ?? 0), 0) ?? 0;
  const percentage = ((confirmed / 3600) * 100).toFixed(2);
  return <main><PublicHeader /><Link href="/tcg/yugioh" className="back-link">← Yu-Gi-Oh! sets</Link>
    <section className="registry-set-intro"><h1 className="visually-hidden">Yu-Gi-Oh! Magnificent Monsters</h1><img src="/magnificent-monsters-logo.png" alt="Yu-Gi-Oh! Magnificent Monsters" className="registry-set-logo" />
      {setError || cardsError ? <p>Registry totals are temporarily unavailable.</p> : <div className="overall-progress-card"><div className="overall-progress-heading"><strong>{confirmed.toLocaleString()} / 3,600 confirmed</strong><span>{percentage}% documented</span></div><div className="overall-progress" role="progressbar" aria-valuemin="0" aria-valuemax="3600" aria-valuenow={confirmed}><span style={{ width: `${percentage}%` }} /></div></div>}
    </section>
    <section className="registry-section"><div className="section-heading"><div><p className="eyebrow">The complete set</p><h2>Choose a card</h2></div><p>Each card contains 200 serial numbers.</p></div>
      {cardsError ? <p>The card list is temporarily unavailable. Please refresh the page.</p> : <div className="card-grid">{cards?.map((card) => { const cardConfirmed = card.serials?.filter((serial) => serial.status === "confirmed").length ?? 0; const cardPercentage = (cardConfirmed / 200) * 100; const catalogImage = getMagnificentMonstersCatalogImage(card); return <Link key={card.id} href={`/card/${card.id}`} className="registry-card" aria-label={`${card.name}: ${cardConfirmed} found out of 200 total cards, ${Math.round(cardPercentage)} percent documented`}>{catalogImage && <img src={catalogImage} alt={card.name} className="registry-card-image" loading="lazy" />}<div className="registry-card-count" style={{ "--card-found": `${cardPercentage.toFixed(1)}%` }}><span className="registry-card-count-value"><strong>{cardConfirmed}</strong> / 200 found</span><span className="registry-card-percent">{Math.round(cardPercentage)}%</span></div></Link>; })}</div>}
    </section>
  </main>;
}
