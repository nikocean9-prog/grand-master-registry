import Link from "next/link";
import CardPhoto from "./CardPhoto";

export default function HomeFeaturedSet({ pulls, confirmed = 0, total = 3600 }) {
  const percent = total ? (confirmed / total) * 100 : 0;

  return (
    <section className="home-featured-set" aria-labelledby="home-featured-set-title">
      <p className="home-section-eyebrow">Featured set</p>
      <Link href="/sets/magnificent-monsters" className="home-featured-set-logo-link">
        <img
          id="home-featured-set-title"
          className="home-featured-set-logo"
          src="/magnificent-monsters-wordmark.webp"
          alt="Magnificent Monsters"
        />
      </Link>
      <p className="home-featured-set-summary">
        Discover all 18 Grand Master Rare cards and their confirmed serials.
      </p>
      <div className="home-featured-set-status" aria-label={`${confirmed} of ${total} serials confirmed`}>
        <span><strong>{confirmed.toLocaleString()}</strong> / {total.toLocaleString()} confirmed</span>
        <span><strong>{percent.toFixed(2)}%</strong> documented</span>
      </div>
      <span className="home-featured-set-progress" aria-hidden="true">
        <span style={{ width: `${Math.max(percent, confirmed ? 0.6 : 0)}%` }} />
      </span>
      <Link href="/sets/magnificent-monsters" className="home-featured-set-button">
        Explore the full set <span aria-hidden="true">→</span>
      </Link>

      {pulls.length > 0 && (
        <div className="home-featured-pulls" aria-label="Selected Magnificent Monsters pulls">
          {pulls.map((pull) => (
            <Link href={`/serial/${pull.serialId}`} className="home-featured-pull" key={pull.cardId}>
              <span className="home-featured-pull-photo">
                <CardPhoto
                  src={pull.imageUrl}
                  crop={pull.displayCrop}
                  alt={`${pull.cardName} serial ${pull.serialLabel}`}
                />
              </span>
              <strong>{pull.cardName}</strong>
              <small>{pull.serialLabel} · Yu-Gi-Oh!</small>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
