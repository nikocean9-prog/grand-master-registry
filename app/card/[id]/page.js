export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import SerialGrid from "../../components/SerialGrid";

export default async function CardPage({ params }) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id, name, image_url, serial_total, card_sets(name, slug, serial_scheme)")
    .eq("id", id)
    .single();

  const { data: serials, error: serialsError } = await supabase
    .from("serials")
    .select("id, serial_number, region, status")
    .eq("card_id", id)
    .order("serial_number");

  if (cardError && cardError.code !== "PGRST116") {
    return (
      <main>
        <Link href="/" className="back-link">← Back to Registry</Link>
        <h1>Card unavailable</h1>
        <p>This card could not be loaded. Check your connection and try again.</p>
      </main>
    );
  }

  if (!card) {
    return (
      <main>
        <Link href="/" className="back-link">← Back to Registry</Link>
        <h1>Card not found</h1>
      </main>
    );
  }

  if (serialsError) {
    return (
      <main>
        <Link href={`/sets/${card.card_sets?.slug || "magnificent-monsters"}`} className="back-link">← Back to Registry</Link>
        <h1>{card.name}</h1>
        <p>Could not load serial numbers.</p>
      </main>
    );
  }

  const standard = serials.filter((serial) => serial.region === "AMERICAS");
  const eRegion = serials.filter((serial) => serial.region === "E");
  const worldwide = serials.filter((serial) => serial.region === "GLOBAL");
  const standardConfirmed = standard.filter(
    (serial) => serial.status === "confirmed"
  ).length;
  const eConfirmed = eRegion.filter(
    (serial) => serial.status === "confirmed"
  ).length;
  const worldwideConfirmed = worldwide.filter((serial) => serial.status === "confirmed").length;
  const totalConfirmed = standardConfirmed + eConfirmed + worldwideConfirmed;
  const total = card.serial_total || serials.length;
  const percentage = total ? ((totalConfirmed / total) * 100).toFixed(1) : "0.0";
  const isGlobal = card.card_sets?.serial_scheme === "global";

  return (
    <main>
      <Link href={`/sets/${card.card_sets?.slug || "magnificent-monsters"}`} className="back-link">← Back to Registry</Link>

      <div className="card-detail-header">
        {card.image_url && (
          <img src={card.image_url} alt={card.name} className="card-detail-image" />
        )}

        <div className="card-detail-copy">
          <p className="eyebrow">{card.card_sets?.name || "Serial Registry"}</p>
          <h1>{card.name}</h1>
          <h2>{totalConfirmed} / {total.toLocaleString()} confirmed</h2>
          <p>{percentage}% of this card documented</p>
          <div className="overall-progress" aria-hidden="true">
            <span style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>

      <div className="serial-legend" aria-label="Serial status legend">
        <span><i className="legend-dot confirmed" /> Confirmed</span>
        <span><i className="legend-dot reported" /> Awaiting verification</span>
        <span><i className="legend-dot unreported" /> Not reported</span>
      </div>

      {isGlobal ? <section className="serial-section">
        <div className="serial-section-heading">
          <h2>Worldwide</h2>
          <strong>{worldwideConfirmed} / {total.toLocaleString()} confirmed</strong>
        </div>
        <SerialGrid serials={worldwide} total={total} />
      </section> : <><section className="serial-section">
        <div className="serial-section-heading">
          <h2>Americas</h2>
          <strong>{standardConfirmed} / 100 confirmed</strong>
        </div>
        <SerialGrid serials={standard} total={100} />
      </section>

      <section className="serial-section">
        <div className="serial-section-heading">
          <h2>Europe-distributed</h2>
          <strong>{eConfirmed} / 100 confirmed</strong>
        </div>
        <SerialGrid serials={eRegion} total={100} />
      </section></>}
    </main>
  );
}
