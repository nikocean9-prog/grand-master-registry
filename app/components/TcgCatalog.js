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

  useEffect(() => {
    getCurrentAdmin(supabase).then((admin) => setIsAdmin(Boolean(admin)));
  }, []);

  const liveTcgs = tcgs.filter((tcg) => tcg.sets.some((set) => set.status === "live"));
  const futureTcgs = tcgs.filter((tcg) => !tcg.sets.some((set) => set.status === "live"));

  return (
    <>
      <div className="live-registry-list">
        {liveTcgs.map((tcg) => {
          const liveSetCount = tcg.sets.filter((set) => set.status === "live").length;
          const previewCount = tcg.sets.filter((set) => set.status !== "live").length;
          return (
            <Link href={`/tcg/${tcg.slug}`} className={`live-registry-card tcg-${tcg.slug}`} key={tcg.slug}>
              <span className="live-registry-art" aria-hidden="true">{tcg.slug === "magic-the-gathering" ? "MTG" : ""}</span>
              <div className="live-registry-copy">
                <span>Trading card game</span>
                <h3>{tcg.name}</h3>
                <p>{liveSetCount} live {liveSetCount === 1 ? "set" : "sets"}{isAdmin && previewCount ? ` · ${previewCount} admin preview` : ""}</p>
              </div>
              <strong>View sets <i aria-hidden="true">→</i></strong>
            </Link>
          );
        })}
      </div>
      {isAdmin && <section className="admin-future-section"><p className="admin-catalog-note">Admin view: future TCGs are visible only to you.</p><h2>Future TCGs</h2><div className="tcg-grid">{futureTcgs.map((tcg) => <Link href={`/tcg/${tcg.slug}`} className="tcg-card planned" key={tcg.slug}><span className="tcg-monogram" aria-hidden="true">{tcg.initials}</span><span className="status-badge planned">Coming soon</span><h3>{tcg.name}</h3><p>{tcg.description}</p><strong>{tcg.sets.length || "No"} {tcg.sets.length === 1 ? "set" : "sets"} listed →</strong></Link>)}</div></section>}
    </>
  );
}
