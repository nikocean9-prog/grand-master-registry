"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const YUGIOH_TILE_ART = {
  "magnificent-monsters": "/graphics/magnificent-monsters-tile.jpg",
  "magnificent-maestros": "/graphics/magnificent-maestros-tile.jpg",
};

const lightningPaths = [
  "M200 66 L238 52 L270 27 L310 20 L354 6 L398 1",
  "M200 66 L242 72 L276 94 L323 101 L360 122 L399 132",
  "M200 66 L165 50 L126 24 L86 27 L42 8 L2 1",
  "M200 66 L159 77 L122 99 L78 104 L39 127 L1 132",
  "M200 66 L229 61 L264 43 L304 48 L345 26 L397 18",
];

function randomSelection(count, lastSelection) {
  const pool = [0, 1, 2, 3, 4];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  let selection = pool.slice(0, count).sort();
  if (selection.join() === lastSelection.join()) selection = [...selection.slice(1), pool[count]].sort();
  return selection;
}

function AnimatedSetTile({ set, artwork, sequenceOffset = 0 }) {
  const [activeBolts, setActiveBolts] = useState([]);
  const firingIndex = useRef(sequenceOffset);
  const lastSelection = useRef([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let timer;
    let flashTimer;
    let stopped = false;

    const fire = () => {
      if (stopped) return;
      const count = [4, 3, 2][firingIndex.current % 3];
      firingIndex.current += 1;
      const next = randomSelection(count, lastSelection.current);
      lastSelection.current = next;
      setActiveBolts(next);
      flashTimer = window.setTimeout(() => setActiveBolts([]), 340);
      timer = window.setTimeout(fire, 1000 + Math.random() * 500);
    };

    timer = window.setTimeout(fire, 450 + sequenceOffset * 260);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.clearTimeout(flashTimer);
    };
  }, [sequenceOffset]);

  const activeSet = useMemo(() => new Set(activeBolts), [activeBolts]);

  return (
    <Link href={set.href} className="animated-set-tile" aria-label={`Open ${set.name}`}>
      <img className="set-tile-background" src={artwork} alt="" />
      <svg className="set-tile-lightning" viewBox="0 0 400 133" aria-hidden="true">
        <defs>
          <filter id={`bolt-glow-${set.slug}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {lightningPaths.map((path, index) => (
          <path key={path} className={activeSet.has(index) ? "lightning-bolt active" : "lightning-bolt"} d={path} pathLength="1" filter={`url(#bolt-glow-${set.slug})`} />
        ))}
      </svg>
      <img className="set-tile-foreground" src={artwork} alt={set.name} />
    </Link>
  );
}

export default function TcgSetDirectory({ sets }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getCurrentAdmin(supabase).then((admin) => setIsAdmin(Boolean(admin)));
  }, []);

  const visibleSets = sets.filter((set) => ["live", "preview"].includes(set.status) || isAdmin);
  const yugiohArtSets = visibleSets.filter((set) => YUGIOH_TILE_ART[set.slug]);

  if (!visibleSets.length) {
    return <div className="empty-state"><h3>No sets are live yet</h3><p>This TCG is in the future expansion plan.</p><Link href="/help#contact" className="hero-button hero-button-primary">Suggest a set</Link></div>;
  }

  if (yugiohArtSets.length) {
    return <div className="animated-set-grid">{yugiohArtSets.map((set, index) => (
      <AnimatedSetTile key={set.name} set={set} artwork={YUGIOH_TILE_ART[set.slug]} sequenceOffset={index} />
    ))}</div>;
  }

  return <div className="set-list">{visibleSets.map((set) => (
    <Link href={set.href} className={`set-card${set.status === "live" ? "" : " muted"}`} key={set.name}>
      <div><span className={`status-badge ${set.status === "live" ? "live" : "planned"}`}>{set.status === "live" ? "Live" : "Admin preview"}</span><h3>{set.name}</h3><p>{set.summary}</p></div>
      <strong>{set.status === "live" ? "Open registry →" : "Preview set →"}</strong>
    </Link>
  ))}</div>;
}
