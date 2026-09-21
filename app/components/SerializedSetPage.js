import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import PublicHeader from "./PublicHeader";
import { getSetWordmark, TCG_HEADER_LOGOS, SET_BRAND_LABELS } from "../lib/setWordmarks";

export default async function SerializedSetPage({ slug, tcgName, eyebrow, title, description, backHref }) {
  const usesCompactCardTiles = tcgName === "Magic: The Gathering";
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: cardSet, error: setError } = await supabase
    .from("card_sets")
    .select("id")
    .eq("slug", slug)
    .eq("status", "live")
    .single();
  const { data: cards, error: cardsError } = cardSet
    ? await supabase
        .from("cards")
        .select("id, name, image_url, serial_total, serials(status)")
        .eq("set_id", cardSet.id)
        .order("id")
    : { data: [], error: setError };

  const total = cards?.reduce((sum, card) => sum + card.serial_total, 0) ?? 0;
  const confirmed = cards?.reduce(
    (sum, card) => sum + (card.serials?.filter((serial) => serial.status === "confirmed").length ?? 0),
    0
  ) ?? 0;
  const percentage = total ? ((confirmed / total) * 100).toFixed(2) : "0.00";
  const setWordmark = getSetWordmark(slug);
  const tcgSlug = { "Magic: The Gathering": "magic-the-gathering", "Grand Archive": "grand-archive", "UniVersus": "universus", "Weiß Schwarz": "weiss-schwarz" }[tcgName] || null;
  const tcgLogo = tcgSlug ? TCG_HEADER_LOGOS[tcgSlug] : null;
  const sharedSerialTotal = cards?.length && cards.every((card) => card.serial_total === cards[0].serial_total)
    ? cards[0].serial_total
    : null;

  return (
    <main className={SET_BRAND_LABELS[slug] ? "expanded-brand-registry" : undefined}>
      <PublicHeader />
      <Link href={backHref} className="back-link">← {tcgName} sets</Link>
      <section className={setWordmark ? "registry-set-intro registry-set-intro--branded" : "registry-hero compact"}>
        {setWordmark ? (
          <>
            <h1 className="visually-hidden">{tcgName} {title}</h1>
            <div className="registry-set-lockup">
              {tcgLogo && <img src={tcgLogo} alt={tcgName} className="registry-set-tcg-logo" />}
              <img src={setWordmark} alt={title} className="registry-set-wordmark" />
              {SET_BRAND_LABELS[slug] && <p className="set-brand-label">{SET_BRAND_LABELS[slug]}</p>}
            </div>
          </>
        ) : (
          <><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="hero-copy">{description}</p></>
        )}
        {setError || cardsError ? (
          <p>Registry totals are temporarily unavailable.</p>
        ) : (
          <div className="overall-progress-card">
            <div className="overall-progress-heading">
              <strong>{confirmed.toLocaleString()} / {total.toLocaleString()} confirmed</strong>
              <span>{percentage}% documented</span>
            </div>
            <div className="overall-progress" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={confirmed}>
              <span style={{ width: `${percentage}%` }} />
            </div>
          </div>
        )}
      </section>
      <section className="registry-section">
        <div className="section-heading">
          <div><p className="eyebrow">The complete set</p><h2>Choose a card</h2></div>
          <p>{sharedSerialTotal ? `Each card contains ${sharedSerialTotal.toLocaleString()} serial numbers.` : `${cards?.length ?? 0} serial-numbered ${cards?.length === 1 ? "card" : "cards"} · ${total.toLocaleString()} serials`}</p>
        </div>
        {cardsError ? <p>The card list is temporarily unavailable. Please refresh the page.</p> : (
          <div className="card-grid">
            {cards?.map((card) => {
              const cardConfirmed = card.serials?.filter((serial) => serial.status === "confirmed").length ?? 0;
              const cardPercentage = card.serial_total ? ((cardConfirmed / card.serial_total) * 100).toFixed(1) : "0.0";
              if (usesCompactCardTiles) {
                return (
                  <Link
                    key={card.id}
                    href={`/card/${card.id}`}
                    className="registry-card registry-card--mtg"
                    aria-label={`${card.name}: ${cardConfirmed} found out of ${card.serial_total.toLocaleString()} total cards, ${Math.round(Number(cardPercentage))} percent documented`}
                  >
                    {card.image_url && <img src={card.image_url} alt={card.name} className="registry-card-image" loading="lazy" />}
                    <div className="registry-card-count" style={{ "--card-found": `${cardPercentage}%` }}>
                      <span className="registry-card-count-value"><strong>{cardConfirmed}</strong> / {card.serial_total.toLocaleString()} found</span>
                      <span className="registry-card-percent">{Math.round(Number(cardPercentage))}%</span>
                    </div>
                  </Link>
                );
              }
              return (
                <Link key={card.id} href={`/card/${card.id}`} className="registry-card">
                  {card.image_url ? <img src={card.image_url} alt={card.name} className="registry-card-image" loading="lazy" /> : <div className="registry-card-art-unavailable">Catalogue image unavailable</div>}
                  <div className="registry-card-content">
                    <h3>{card.name}</h3>
                    <p>{cardConfirmed} / {card.serial_total.toLocaleString()} confirmed · {cardPercentage}%</p>
                    <div className="card-progress" aria-hidden="true"><span style={{ width: `${cardPercentage}%` }} /></div>
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
