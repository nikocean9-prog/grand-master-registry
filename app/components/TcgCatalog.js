"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function TcgCatalog({ tcgs }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmedByTcg, setConfirmedByTcg] = useState({});

  useEffect(() => {
    getCurrentAdmin(supabase).then((admin) => setIsAdmin(Boolean(admin)));
  }, []);

  const liveTcgs = tcgs.filter((tcg) => tcg.sets.some((set) => set.status === "live"));
  const futureTcgs = tcgs.filter((tcg) => !tcg.sets.some((set) => set.status === "live"));

  useEffect(() => {
    async function loadConfirmedTotals() {
      const totals = await Promise.all(liveTcgs.map(async (tcg) => {
        const liveSetSlugs = tcg.sets
          .filter((set) => set.status === "live" && set.slug)
          .map((set) => set.slug);
        if (!liveSetSlugs.length) return [tcg.slug, 0];

        const { count, error } = await supabase
          .from("serials")
          .select("id, cards!inner(card_sets!inner(slug))", { count: "exact", head: true })
          .eq("status", "confirmed")
          .in("cards.card_sets.slug", liveSetSlugs);

        return [tcg.slug, error ? 0 : (count || 0)];
      }));

      setConfirmedByTcg(Object.fromEntries(totals));
    }

    loadConfirmedTotals();
  }, [tcgs]);

  return (
    <>
      <div className="live-registry-list live-registry-grid">
        {liveTcgs.map((tcg) => {
          const liveSetCount = tcg.sets.filter((set) => set.status === "live").length;
          const previewCount = tcg.sets.filter((set) => set.status !== "live").length;
          const total = tcg.sets
            .filter((set) => set.status === "live")
            .reduce((sum, set) => sum + Number(set.serials || 0), 0);
          const confirmed = confirmedByTcg[tcg.slug] || 0;
          const percentage = total ? (confirmed / total) * 100 : 0;
          return (
            <Link href={`/tcg/${tcg.slug}`} className={`live-registry-card tcg-${tcg.slug}`} key={tcg.slug}>
              <span className="live-registry-name">{tcg.name}</span>
              <span className="live-registry-art">{tcg.logo && <img src={tcg.slug === "magic-the-gathering" ? "/graphics/magic-official-logo-dark.webp" : tcg.logo} alt={tcg.name} />}</span>
              <span className="live-registry-tracker">
                <span className="live-registry-tracker-heading">
                  <strong>{confirmed.toLocaleString()} / {total.toLocaleString()} confirmed</strong>
                  <span>{percentage.toFixed(2)}% documented</span>
                </span>
                <span className="live-registry-progress" role="progressbar" aria-label={`${tcg.name} registry progress`} aria-valuemin="0" aria-valuemax={total} aria-valuenow={confirmed}>
                  <span style={{ width: `${percentage}%` }} />
                </span>
                {isAdmin && previewCount ? <small>{liveSetCount} live {liveSetCount === 1 ? "set" : "sets"} · {previewCount} admin preview</small> : null}
              </span>
            </Link>
          );
        })}
      </div>
      {futureTcgs.length > 0 && (
        <section className="future-registry-section">
          <p className="eyebrow">Coming soon</p>
          <h2>Future TCGs</h2>
          <div className="live-registry-list">
            {futureTcgs.map((tcg) => (
              <Link
                href={`/tcg/${tcg.slug}`}
                className={`live-registry-card future-registry-card tcg-${tcg.slug}`}
                key={tcg.slug}
              >
                <span className="live-registry-art" aria-hidden="true">
                  <img src={tcg.logo} alt="" />
                </span>
                <div className="live-registry-copy">
                  <span>Trading card game</span>
                  <h3>{tcg.name}</h3>
                  <p>{tcg.description}</p>
                </div>
                <strong className="future-registry-status">Coming soon</strong>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
