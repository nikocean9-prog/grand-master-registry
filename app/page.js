import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import AdminRegistryLink from "./components/AdminRegistryLink";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { count, error: countError } = await supabase
    .from("serials")
    .select("*", { count: "exact", head: true })
    .eq("status", "confirmed");

  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select(`
      id,
      name,
      image_url,
      serials (
        status
      )
    `)
    .order("id");

  const confirmed = count ?? 0;
  const total = 3600;
  const percentage = ((confirmed / total) * 100).toFixed(2);

  return (
    <main>
      <nav className="public-nav" aria-label="Main navigation">
        <Link href="/" className="site-name">
          Grand Master Registry
        </Link>
        <div className="nav-actions">
          <Link href="/submit" className="nav-link nav-link-primary">
            Submit a Pull
          </Link>
          <AdminRegistryLink />
        </div>
      </nav>

      <section className="registry-hero">
        <p className="eyebrow">Yu-Gi-Oh! Magnificent Monsters</p>
        <h1>Track every Grand Master Rare</h1>
        <p className="hero-copy">
          A community registry documenting serial-numbered Grand Master Rares
          pulled around the world.
        </p>

        {countError ? (
          <p>Registry totals are temporarily unavailable. Please try again shortly.</p>
        ) : (
          <div className="overall-progress-card">
            <div className="overall-progress-heading">
              <strong>{confirmed.toLocaleString()} / 3,600 confirmed</strong>
              <span>{percentage}% documented</span>
            </div>
            <div
              className="overall-progress"
              role="progressbar"
              aria-label="Worldwide Grand Master Rare registry progress"
              aria-valuemin="0"
              aria-valuemax="3600"
              aria-valuenow={confirmed}
            >
              <span style={{ width: `${percentage}%` }} />
            </div>
          </div>
        )}

        <Link href="/submit" className="hero-submit-button">
          Submit a Pull
        </Link>
      </section>

      <section className="registry-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The complete set</p>
            <h2>Magnificent Monsters</h2>
          </div>
          <p>Choose a card to view all 200 serial numbers.</p>
        </div>

        {cardsError ? (
          <p>The card list is temporarily unavailable. Please refresh the page.</p>
        ) : (
          <div className="card-grid">
            {cards?.map((card) => {
              const cardConfirmed =
                card.serials?.filter((serial) => serial.status === "confirmed")
                  .length ?? 0;
              const cardPercentage = ((cardConfirmed / 200) * 100).toFixed(1);

              return (
                <Link
                  key={card.id}
                  href={`/card/${card.id}`}
                  className="registry-card"
                >
                  {card.image_url && (
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="registry-card-image"
                      loading="lazy"
                    />
                  )}

                  <div className="registry-card-content">
                    <h3>{card.name}</h3>
                    <p>
                      {cardConfirmed} / 200 confirmed · {cardPercentage}%
                    </p>
                    <div className="card-progress" aria-hidden="true">
                      <span style={{ width: `${cardPercentage}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
