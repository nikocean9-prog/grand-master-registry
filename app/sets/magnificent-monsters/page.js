import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import PublicHeader from "../../components/PublicHeader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Magnificent Monsters Registry | TCG Serial Tracker", description: "Track all 3,600 Yu-Gi-Oh! Magnificent Monsters Grand Master Rare serial numbers." };

export default async function MagnificentMonstersPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { count, error: countError } = await supabase.from("serials").select("*", { count: "exact", head: true }).eq("status", "confirmed");
  const { data: cards, error: cardsError } = await supabase.from("cards").select(`id, name, image_url, serials ( status )`).order("id");
  const confirmed = count ?? 0;
  const percentage = ((confirmed / 3600) * 100).toFixed(2);
  return <main><PublicHeader /><Link href="/tcg/yugioh" className="back-link">← Yu-Gi-Oh! sets</Link>
    <section className="registry-hero compact"><p className="eyebrow">Yu-Gi-Oh! · Grand Master Rares</p><h1>Magnificent Monsters</h1><p className="hero-copy">A community registry documenting serial-numbered Grand Master Rares pulled around the world.</p>
      {countError ? <p>Registry totals are temporarily unavailable.</p> : <div className="overall-progress-card"><div className="overall-progress-heading"><strong>{confirmed.toLocaleString()} / 3,600 confirmed</strong><span>{percentage}% documented</span></div><div className="overall-progress" role="progressbar" aria-valuemin="0" aria-valuemax="3600" aria-valuenow={confirmed}><span style={{ width: `${percentage}%` }} /></div></div>}
    </section>
    <section className="registry-section"><div className="section-heading"><div><p className="eyebrow">The complete set</p><h2>Choose a card</h2></div><p>Each card contains 200 serial numbers.</p></div>
      {cardsError ? <p>The card list is temporarily unavailable. Please refresh the page.</p> : <div className="card-grid">{cards?.map((card) => { const cardConfirmed = card.serials?.filter((serial) => serial.status === "confirmed").length ?? 0; const cardPercentage = ((cardConfirmed / 200) * 100).toFixed(1); return <Link key={card.id} href={`/card/${card.id}`} className="registry-card">{card.image_url && <img src={card.image_url} alt={card.name} className="registry-card-image" loading="lazy" />}<div className="registry-card-content"><h3>{card.name}</h3><p>{cardConfirmed} / 200 confirmed · {cardPercentage}%</p><div className="card-progress" aria-hidden="true"><span style={{ width: `${cardPercentage}%` }} /></div></div></Link>; })}</div>}
    </section>
  </main>;
}
