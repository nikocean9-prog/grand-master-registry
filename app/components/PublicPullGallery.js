"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PublicPullGallery({ pulls }) {
  const [activePull, setActivePull] = useState(null);

  useEffect(() => {
    if (!activePull) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setActivePull(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activePull]);

  return (
    <>
      <div className="pull-gallery-grid">
        {pulls.map((pull) => (
          <button key={pull.id} type="button" className="pull-gallery-item" onClick={() => setActivePull(pull)}>
            <img src={pull.imageUrl} alt={`${pull.cardName} serial ${pull.serialLabel}`} loading="lazy" />
            <span><strong>{pull.cardName}</strong><small>Serial {pull.serialLabel}</small></span>
          </button>
        ))}
      </div>

      {activePull && (
        <div className="pull-gallery-modal" role="dialog" aria-modal="true" aria-labelledby="gallery-photo-title" onClick={() => setActivePull(null)}>
          <div className="pull-gallery-modal-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="pull-gallery-close" onClick={() => setActivePull(null)} aria-label="Close photo">×</button>
            <img src={activePull.imageUrl} alt={`${activePull.cardName} serial ${activePull.serialLabel}`} />
            <div>
              <h2 id="gallery-photo-title">{activePull.cardName}</h2>
              <p>Serial {activePull.serialLabel} · {activePull.setName}</p>
              <Link href={`/serial/${activePull.serialId}`}>View confirmed serial</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
