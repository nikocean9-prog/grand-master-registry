import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import PublicHeader from "./PublicHeader";

export default async function SerializedSetPage({ slug, tcgName, eyebrow, title, description, backHref }) {
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

  return (
    <main>
      <PublicHeader />
      <Link href={backHref} className="back-link">← {tcgName} sets</Link>
      <section className="registry-hero compact">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hero-copy">{description}</p>
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
          <div><p className="eyebrow">The complete serialized release</p><h2>Choose a card</h2></div>
          <p>{cards?.length ?? 0} serial-numbered {cards?.length === 1 ? "card" : "cards"} · {total.toLocaleString()} serials</p>
        </div>
        {cardsError ? <p>The card list is temporarily unavailable. Please refresh the page.</p> : (
          <div className="card-grid">
            {cards?.map((card) => {
              const cardConfirmed = card.serials?.filter((serial) => serial.status === "confirmed").length ?? 0;
              const cardPercentage = card.serial_total ? ((cardConfirmed / card.serial_total) * 100).toFixed(1) : "0.0";
              return (
                <Link key={card.id} href={`/card/${card.id}`} className="registry-card">
                  {card.image_url && <img src={card.image_url} alt={card.name} className="registry-card-image" loading="lazy" />}
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
