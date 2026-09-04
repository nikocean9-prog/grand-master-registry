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

  const visibleTcgs = tcgs.filter(
    (tcg) => isAdmin || tcg.sets.some((set) => set.status === "live")
  );

  return (
    <>
      {isAdmin && <p className="admin-catalog-note">Admin view: future TCGs are visible to you.</p>}
      <div className="tcg-grid">
        {visibleTcgs.map((tcg) => (
          <Link href={`/tcg/${tcg.slug}`} className={`tcg-card ${tcg.status}`} key={tcg.slug}>
            <span className="tcg-monogram" aria-hidden="true">{tcg.initials}</span>
            <span className={`status-badge ${tcg.status}`}>{tcg.status === "live" ? "Live" : "Coming soon"}</span>
            <h3>{tcg.name}</h3>
            <p>{tcg.description}</p>
            <strong>{tcg.sets.length || "No"} {tcg.sets.length === 1 ? "set" : "sets"} listed →</strong>
          </Link>
        ))}
      </div>
    </>
  );
}
