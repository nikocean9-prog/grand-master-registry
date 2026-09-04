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

export default function AdminOnlyTcgPage({ tcg }) {
  const [allowed, setAllowed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getCurrentAdmin(supabase).then((admin) => {
      if (admin) setAllowed(true);
      else router.replace("/");
    });
  }, [router]);

  if (!allowed) return <main><p>Checking access…</p></main>;

  return (
    <main><PublicHeader /><Link href="/#tcgs" className="back-link">← All TCGs</Link>
      <section className="catalog-heading"><span className="tcg-monogram large" aria-hidden="true">{tcg.initials}</span><div><p className="eyebrow">Admin preview</p><h1>{tcg.name}</h1><p>{tcg.description}</p></div></section>
      <section className="registry-section"><div className="section-heading"><div><p className="eyebrow">Set directory</p><h2>Future sets</h2></div></div>
        {tcg.sets.length ? <div className="set-list">{tcg.sets.map((set) => <div className="set-card muted" key={set.name}><div><span className="status-badge planned">Planned</span><h3>{set.name}</h3></div><strong>Coming soon</strong></div>)}</div> : <div className="empty-state"><h3>No sets added yet</h3><p>This TCG is only visible in the admin preview.</p></div>}
      </section>
    </main>
  );
}
