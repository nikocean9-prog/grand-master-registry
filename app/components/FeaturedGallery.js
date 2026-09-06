"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function FeaturedGallery({ features }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeFeature = features[activeIndex];

  useEffect(() => {
    if (paused || features.length < 2) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % features.length);
    }, 9000);

    return () => window.clearInterval(timer);
  }, [features.length, paused]);

  if (!activeFeature) return null;

  return (
    <section className="featured-gallery" aria-labelledby="featured-gallery-title">
      <div className="featured-gallery-heading">
        <div>
          <p className="eyebrow">Featured stories</p>
          <h2 id="featured-gallery-title">Cards with a story</h2>
        </div>
        <p>Notable cards, discoveries and moments from across the collecting world.</p>
      </div>

      <article
        className="featured-story"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
        }}
      >
        <div className={`featured-story-image ${activeFeature.imageClass || ""}`}>
          {activeFeature.image && (
            <img src={activeFeature.image} alt={activeFeature.imageAlt} />
          )}
        </div>

        <div className="featured-story-copy">
          <p className="featured-story-label">{activeFeature.label}</p>
          <h3>{activeFeature.title}</h3>
          <p className="featured-story-summary">{activeFeature.summary}</p>
          <ul>
            {activeFeature.facts.map((fact) => <li key={fact}>{fact}</li>)}
          </ul>
          <div className="featured-story-links">
            {activeFeature.href && <Link href={activeFeature.href}>{activeFeature.linkLabel} →</Link>}
            {activeFeature.sourceUrl && (
              <a href={activeFeature.sourceUrl} target="_blank" rel="noreferrer">
                {activeFeature.sourceLabel || "View source"} ↗
              </a>
            )}
          </div>
        </div>
      </article>

    </section>
  );
}
