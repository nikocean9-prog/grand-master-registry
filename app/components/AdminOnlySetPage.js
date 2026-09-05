"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../lib/adminAuth";
import PublicHeader from "./PublicHeader";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminOnlySetPage({ slug, name, releaseDate }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadSet() {
      const admin = await getCurrentAdmin(supabase);
      if (!admin) {
        router.replace("/");
        return;
      }

      const { data: cardSet, error: setError } = await supabase.from("card_sets").select("id").eq("slug", slug).single();
      if (setError || !cardSet) {
        setLoadError(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from("cards").select("id, name, image_url").eq("set_id", cardSet.id).order("id");
      setCards(data || []);
      setLoadError(Boolean(error));
      setLoading(false);
    }
    loadSet();
  }, [router, slug]);

  if (loading) return <main><p>Checking admin access…</p></main>;

  return <main><PublicHeader /><Link href="/tcg/yugioh" className="back-link">← Yu-Gi-Oh! sets</Link>
    <section className="registry-hero compact"><p className="eyebrow">Admin preview · Hidden from public</p><h1>{name}</h1><p className="hero-copy">Prepared ahead of its {releaseDate} release. Visitors cannot view this set or submit pulls for it yet.</p>
      <div className="overall-progress-card"><div className="overall-progress-heading"><strong>0 / 3,600 confirmed</strong><span>0.00% documented</span></div><div className="overall-progress" role="progressbar" aria-valuemin="0" aria-valuemax="3600" aria-valuenow="0"><span style={{ width: "0%" }} /></div></div>
    </section>
    <section className="registry-section"><div className="section-heading"><div><p className="eyebrow">Prepared card list</p><h2>18 Grand Master Rares</h2></div><p>Each card contains 200 serial numbers.</p></div>
      {loadError ? <p>The set preview could not be loaded.</p> : <div className="card-grid">{cards.map((card) => <article key={card.id} className="registry-card">{card.image_url && <img src={card.image_url} alt={card.name} className="registry-card-image" loading="lazy" />}<div className="registry-card-content"><h3>{card.name}</h3><p>0 / 200 confirmed · 0.0%</p><div className="card-progress" aria-hidden="true"><span style={{ width: "0%" }} /></div></div></article>)}</div>}
    </section>
  </main>;
}
