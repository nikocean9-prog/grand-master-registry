"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const candidates = [
  {
    name: "The Soul Stone",
    game: "Magic: The Gathering | Marvel's Spider-Man",
    treatment: "Cosmic Foil",
    population: "Unknown",
    confidence: "Census candidate",
    note: "Use confirmed sightings to estimate the surviving population. Important: 242 is the card's collector number, not a published print run.",
    source: "https://scryfall.com/card/spm/242/the-soul-stone",
  },
  {
    name: "The Mind Stone",
    game: "Magic: The Gathering | Marvel Super Heroes",
    treatment: "Textless Cosmic Foil",
    population: "Fewer than 150",
    confidence: "Publisher stated",
    note: "An ultra-limited, unnumbered printing. Each verified physical copy should be tracked through photographs, provenance and distinguishing marks.",
    source: "https://magic.wizards.com/en/news/feature/collecting-marvel-super-heroes",
  },
  {
    name: "Smaug the Magnificent",
    game: "Magic: The Gathering | The Hobbit",
    treatment: "Gleaming Gold Headliner",
    population: "Approximately 500",
    confidence: "Publisher stated",
    note: "English-only headliner found exclusively in Collector Boosters of any language. Not individually serialized.",
    source: "https://magic.wizards.com/en/news/feature/collecting-the-hobbit",
  },
  {
    name: "Sothera, the Supervoid",
    game: "Magic: The Gathering | Edge of Eternities",
    treatment: "Textless Singularity Foil Headliner",
    population: "Unknown",
    confidence: "Census candidate",
    note: "Wizards calls this unnumbered Collector Booster exclusive extremely rare but does not publish a total. It is well suited to observed-copy tracking.",
    source: "https://magic.wizards.com/en/news/feature/collecting-edge-of-eternities",
  },
  {
    name: "Avatar Aang",
    game: "Magic: The Gathering | Avatar: The Last Airbender",
    treatment: "Borderless Raised Foil Headliner",
    population: "Unknown",
    confidence: "Research candidate",
    note: "An unnumbered, English-only Collector Booster headliner appearing in less than 1% of packs. Review market sightings before activating its census.",
    source: "https://magic.wizards.com/en/news/feature/collecting-avatar-the-last-airbender",
  },
];

export default function SpecialMentionsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") {
        window.location.href = "/admin/mfa";
        return;
      }

      const admin = await getCurrentAdmin(supabase);
      if (!admin) {
        await supabase.auth.signOut();
        window.location.href = "/admin?reason=session";
        return;
      }

      setLoading(false);
    }

    checkAdmin();
  }, []);

  if (loading) {
    return <main><h1>Special Mentions</h1><p>Checking admin access…</p></main>;
  }

  return (
    <main className="special-mentions-page">
      <Link href="/admin/dashboard" className="back-link">← Admin Home</Link>

      <header className="special-mentions-hero">
        <div>
          <p className="special-mentions-eyebrow">Admin working area</p>
          <h1>Special Mentions</h1>
          <p>
            A working shortlist for exceptionally rare cards that need an open-ended,
            verified-copy census rather than a fixed set checklist.
          </p>
        </div>
        <span>Working title</span>
      </header>

      <section className="special-mentions-notice">
        <strong>Eligibility and population rule</strong>
        <p>
          Serialised cards are never included here. Only verified, unique physical copies of
          qualifying unnumbered cards should increase the confirmed count. Publisher print runs,
          observed copies and grading populations must remain separate figures.
        </p>
      </section>

      <div className="special-mentions-heading">
        <div>
          <p className="special-mentions-eyebrow">Initial research</p>
          <h2>Recommended starter cards</h2>
        </div>
        <p>{candidates.length} candidates</p>
      </div>

      <div className="special-mentions-grid">
        {candidates.map((candidate) => (
          <article className="special-mention-card" key={`${candidate.game}-${candidate.name}`}>
            <div className="special-mention-card-topline">
              <span>{candidate.confidence}</span>
              <strong>{candidate.population}</strong>
            </div>
            <p className="special-mention-game">{candidate.game}</p>
            <h3>{candidate.name}</h3>
            <p className="special-mention-treatment">{candidate.treatment}</p>
            <p>{candidate.note}</p>
            <a href={candidate.source} target="_blank" rel="noreferrer">Review source ↗</a>
          </article>
        ))}
      </div>
    </main>
  );
}
