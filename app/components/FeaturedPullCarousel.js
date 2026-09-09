"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CardPhoto from "./CardPhoto";

function framingClass(cardName = "") {
  const name = cardName.toLowerCase();

  if (name.includes("gagaga girl")) return "featured-pull-focus-gagaga";
  if (name.includes("odd-eyes pendulum dragon")) return "featured-pull-focus-odd-eyes";
  if (name.includes("dark magician")) return "featured-pull-focus-dark-magician";
  return "featured-pull-focus-default";
}

export default function FeaturedPullCarousel({ pulls }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);
  const activePull = pulls[activeIndex];

  function move(direction) {
    setActiveIndex((current) => (current + direction + pulls.length) % pulls.length);
  }

  useEffect(() => {
    if (paused || pulls.length < 2) return undefined;
    const timer = window.setInterval(() => move(1), 7000);
    return () => window.clearInterval(timer);
  }, [paused, pulls.length]);

  if (!activePull) return null;

  return (
    <section className="featured-pull-section" aria-labelledby="featured-pull-title">
      <div className="featured-pull-heading">
        <div>
          <p className="home-section-eyebrow">From the registry</p>
          <h2 id="featured-pull-title">Featured Yu-Gi-Oh! Pull</h2>
        </div>
        <Link href="/gallery?tcg=yugioh">View Yu-Gi-Oh! pulls</Link>
      </div>

      <article
        className="featured-pull-card"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
        }}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current === null) return;
          const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
          const distance = endX - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(distance) >= 45) move(distance < 0 ? 1 : -1);
        }}
      >
        <Link
          href={`/serial/${activePull.serialId}`}
          className={`featured-pull-image ${framingClass(activePull.cardName)}`}
          aria-label={`View ${activePull.cardName}, serial ${activePull.serialLabel}`}
        >
          <span className="featured-pull-image-window">
            <CardPhoto
              className="featured-pull-evidence"
              src={activePull.imageUrl}
              alt={`${activePull.cardName} serial ${activePull.serialLabel}`}
              crop={activePull.displayCrop}
            />
          </span>
          <img
            className="featured-pull-frame"
            src="/graphics/featured-pull-grand-master-frame.png"
            alt=""
            aria-hidden="true"
          />
        </Link>

        <div className="featured-pull-copy">
          <p className="home-section-eyebrow">Confirmed pull</p>
          <h3>{activePull.cardName}</h3>
          <p className="featured-pull-serial">{activePull.serialLabel}</p>
          <p>{activePull.setName}</p>
          <div className="featured-pull-discovery" aria-label={`${activePull.confirmedCount} of ${activePull.serialTotal} copies confirmed`}>
            <div className="featured-pull-discovery-label">
              <span>{activePull.confirmedCount} of {activePull.serialTotal} confirmed</span>
              <strong>{activePull.discoveredPercent}% discovered</strong>
            </div>
            <span className="featured-pull-progress" aria-hidden="true">
              <span style={{ width: `${activePull.discoveredPercent}%` }} />
            </span>
          </div>
          <Link href={`/serial/${activePull.serialId}`} className="featured-pull-link">
            View registry entry
          </Link>
        </div>

        {pulls.length > 1 && (
          <>
            <button className="featured-pull-arrow previous" type="button" onClick={() => move(-1)} aria-label="Previous featured pull">‹</button>
            <button className="featured-pull-arrow next" type="button" onClick={() => move(1)} aria-label="Next featured pull">›</button>
          </>
        )}
      </article>

      {pulls.length > 1 && (
        <div className="featured-pull-dots" aria-label="Choose a featured Yu-Gi-Oh! pull">
          {pulls.map((pull, index) => (
            <button
              key={pull.id}
              type="button"
              className={index === activeIndex ? "active" : ""}
              aria-label={`Show ${pull.cardName}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
