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
          const logoSrc = tcg.slug === "yugioh"
            ? "/graphics/yugioh-official-logo.svg"
            : tcg.slug === "magic-the-gathering"
              ? "/graphics/magic-official-logo.svg"
              : null;
          return (
            <Link href={`/tcg/${tcg.slug}`} className={`live-registry-card tcg-${tcg.slug}`} key={tcg.slug}>
              <span className="live-registry-art" aria-hidden="true">{logoSrc && <img src={logoSrc} alt="" />}</span>
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
                  <span className="future-registry-logo">{tcg.name}</span>
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
