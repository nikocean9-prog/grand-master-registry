"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function HomeStoryCarousel({ stories }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);
  const activeStory = stories[activeIndex];

  function move(direction) {
    setActiveIndex((current) => (current + direction + stories.length) % stories.length);
  }

  useEffect(() => {
    if (paused || stories.length < 2) return undefined;
    const timer = window.setInterval(() => move(1), 8500);
    return () => window.clearInterval(timer);
  }, [paused, stories.length]);

  if (!activeStory) return null;

  return (
    <section className="home-story-section" aria-labelledby="home-story-title">
      <div className="home-feature-board-heading">
        <div><p className="home-section-eyebrow">From across the registry</p><h2>Featured</h2></div>
        <Link href="/wiki">Browse Wiki &amp; Articles</Link>
      </div>
      <article
        className="home-story-card"
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
        {stories.length > 1 && (
          <button className="home-story-arrow previous" type="button" onClick={() => move(-1)} aria-label="Previous story">
            ‹
          </button>
        )}
        <div className="home-story-copy">
          <p className="home-section-eyebrow">{activeStory.kicker || "Featured"}</p>
          <h2 id="home-story-title">{activeStory.title}</h2>
          <p>{activeStory.summary}</p>
          <Link href={activeStory.href} className="home-story-button">{activeStory.actionLabel || "Learn more"}</Link>
        </div>
        <div className={`home-story-image ${activeStory.imageClass || ""}`}>
          {activeStory.image && <img src={activeStory.image} alt={activeStory.imageAlt || activeStory.title} />}
        </div>
        {stories.length > 1 && (
          <button className="home-story-arrow next" type="button" onClick={() => move(1)} aria-label="Next story">
            ›
          </button>
        )}
      </article>
      {stories.length > 1 && (
        <div className="home-story-dots" aria-label="Choose a featured item">
          {stories.map((story, index) => (
            <button
              key={story.title}
              type="button"
              className={index === activeIndex ? "active" : ""}
              aria-label={`Show ${story.title}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
