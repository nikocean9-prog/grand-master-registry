"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../lib/adminAuth";
import { SET_WORDMARKS } from "../lib/setWordmarks";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function SetLogoTile({ set, logo, confirmed = 0 }) {
  const total = set.serials || 0;
  const percentage = total ? (confirmed / total) * 100 : 0;
  return (
    <Link href={set.href} className="set-logo-tile" aria-label={`Open ${set.name}: ${confirmed} of ${total} confirmed`}>
      <span className="set-logo-art"><img src={logo} alt={set.name} /></span>
      <span className="set-logo-tracker">
        <span className="set-logo-tracker-heading"><strong>{confirmed.toLocaleString()} / {total.toLocaleString()} confirmed</strong><span>{percentage.toFixed(2)}% documented</span></span>
        <span className="set-logo-progress" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={confirmed}><span style={{ width: `${percentage}%` }} /></span>
      </span>
    </Link>
  );
}

export default function TcgSetDirectory({ sets, tcgSlug }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmedBySet, setConfirmedBySet] = useState({});

  useEffect(() => {
    getCurrentAdmin(supabase).then((admin) => setIsAdmin(Boolean(admin)));
  }, []);

  useEffect(() => {
    const trackedSlugs = sets.filter((set) => SET_WORDMARKS[set.slug]).map((set) => set.slug);
    if (!trackedSlugs.length) return;

    async function loadConfirmedTotals() {
      const { data: setRows, error: setError } = await supabase.from("card_sets").select("id, slug").in("slug", trackedSlugs);
      if (setError || !setRows?.length) return;

      const totals = await Promise.all(setRows.map(async (setRow) => {
        const { count, error } = await supabase
          .from("serials")
          .select("id, cards!inner(set_id)", { count: "exact", head: true })
          .eq("status", "confirmed")
          .eq("cards.set_id", setRow.id);
        return [setRow.slug, error ? 0 : (count || 0)];
      }));
      setConfirmedBySet(Object.fromEntries(totals));
    }

    loadConfirmedTotals();
  }, [sets]);

  const visibleSets = sets.filter((set) => ["live", "preview"].includes(set.status) || isAdmin);
  const logoSets = visibleSets.filter((set) => SET_WORDMARKS[set.slug]);

  if (!visibleSets.length) {
    return <div className="empty-state"><h3>No sets are live yet</h3><p>This TCG is in the future expansion plan.</p><Link href="/help#contact" className="hero-button hero-button-primary">Suggest a set</Link></div>;
  }

  if (logoSets.length === visibleSets.length) {
    return <div className={`set-logo-grid set-logo-grid--${tcgSlug}`}>{logoSets.map((set) => (
      <SetLogoTile key={set.name} set={set} logo={SET_WORDMARKS[set.slug]} confirmed={confirmedBySet[set.slug] || 0} />
    ))}</div>;
  }

  return <div className="set-list">{visibleSets.map((set) => (
    <Link href={set.href} className={`set-card${set.status === "live" ? "" : " muted"}`} key={set.name}>
      <div><span className={`status-badge ${set.status === "live" ? "live" : "planned"}`}>{set.status === "live" ? "Live" : "Admin preview"}</span><h3>{set.name}</h3><p>{set.summary}</p></div>
      <strong>{set.status === "live" ? "Open registry →" : "Preview set →"}</strong>
    </Link>
  ))}</div>;
}
