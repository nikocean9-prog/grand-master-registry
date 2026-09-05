"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function TcgSetDirectory({ sets }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getCurrentAdmin(supabase).then((admin) => setIsAdmin(Boolean(admin)));
  }, []);

  const visibleSets = sets.filter((set) => set.status === "live" || isAdmin);

  if (!visibleSets.length) {
    return <div className="empty-state"><h3>No sets are live yet</h3><p>This TCG is in the future expansion plan.</p><Link href="/help#contact" className="hero-button hero-button-primary">Suggest a set</Link></div>;
  }

  return <div className="set-list">{visibleSets.map((set) => (
    <Link href={set.href} className={`set-card${set.status === "live" ? "" : " muted"}`} key={set.name}>
      <div><span className={`status-badge ${set.status === "live" ? "live" : "planned"}`}>{set.status === "live" ? "Live" : "Admin preview"}</span><h3>{set.name}</h3><p>{set.summary}</p></div>
      <strong>{set.status === "live" ? "Open registry →" : "Preview set →"}</strong>
    </Link>
  ))}</div>;
}
