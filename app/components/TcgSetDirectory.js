"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const YUGIOH_SET_LOGOS = {
  "magnificent-monsters": "/magnificent-monsters-logo.png",
  "magnificent-maestros": "/magnificent-maestros-logo.png",
};

function YugiohSetTile({ set, logo, confirmed = 0 }) {
  const total = set.serials || 0;
  const percentage = total ? (confirmed / total) * 100 : 0;
  return (
    <Link href={set.href} className="yugioh-set-tile" aria-label={`Open ${set.name}: ${confirmed} of ${total} confirmed`}>
      <span className="yugioh-set-wordmark"><img src={logo} alt={set.name} /></span>
      <span className="yugioh-set-tracker">
        <span className="yugioh-set-tracker-heading"><strong>{confirmed.toLocaleString()} / {total.toLocaleString()} confirmed</strong><span>{percentage.toFixed(2)}% documented</span></span>
        <span className="yugioh-set-progress" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={confirmed}><span style={{ width: `${percentage}%` }} /></span>
      </span>
    </Link>
  );
}

export default function TcgSetDirectory({ sets }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmedBySet, setConfirmedBySet] = useState({});

  useEffect(() => {
    getCurrentAdmin(supabase).then((admin) => setIsAdmin(Boolean(admin)));
  }, []);

  useEffect(() => {
    const trackedSlugs = sets.filter((set) => YUGIOH_SET_LOGOS[set.slug]).map((set) => set.slug);
    if (!trackedSlugs.length) return;

    async function loadConfirmedTotals() {
      const { data: setRows, error: setError } = await supabase.from("card_sets").select("id, slug").in("slug", trackedSlugs);
      if (setError || !setRows?.length) return;

      const totals = await Promise.all(setRows.map(async (setRow) => {
        const { data: cards, error } = await supabase.from("cards").select("serials ( status )").eq("set_id", setRow.id);
        if (error) return [setRow.slug, 0];
        const confirmed = (cards || []).reduce((sum, card) => sum + (card.serials?.filter((serial) => serial.status === "confirmed").length || 0), 0);
        return [setRow.slug, confirmed];
      }));
      setConfirmedBySet(Object.fromEntries(totals));
    }

    loadConfirmedTotals();
  }, [sets]);

  const visibleSets = sets.filter((set) => ["live", "preview"].includes(set.status) || isAdmin);
  const yugiohArtSets = visibleSets.filter((set) => YUGIOH_SET_LOGOS[set.slug]);

  if (!visibleSets.length) {
    return <div className="empty-state"><h3>No sets are live yet</h3><p>This TCG is in the future expansion plan.</p><Link href="/help#contact" className="hero-button hero-button-primary">Suggest a set</Link></div>;
  }

  if (yugiohArtSets.length) {
    return <div className="yugioh-set-grid">{yugiohArtSets.map((set) => (
      <YugiohSetTile key={set.name} set={set} logo={YUGIOH_SET_LOGOS[set.slug]} confirmed={confirmedBySet[set.slug] || 0} />
    ))}</div>;
  }

  return <div className="set-list">{visibleSets.map((set) => (
    <Link href={set.href} className={`set-card${set.status === "live" ? "" : " muted"}`} key={set.name}>
      <div><span className={`status-badge ${set.status === "live" ? "live" : "planned"}`}>{set.status === "live" ? "Live" : "Admin preview"}</span><h3>{set.name}</h3><p>{set.summary}</p></div>
      <strong>{set.status === "live" ? "Open registry →" : "Preview set →"}</strong>
    </Link>
  ))}</div>;
}
