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
    .select("id, name, image_url")
    .eq("id", id)
    .single();

  const { data: serials, error: serialsError } = await supabase
    .from("serials")
    .select("id, serial_number, region, status")
    .eq("card_id", id)
    .order("serial_number");

  if (cardError || !card) {
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
        <Link href="/" className="back-link">← Back to Registry</Link>
        <h1>{card.name}</h1>
        <p>Could not load serial numbers.</p>
      </main>
    );
  }

  const standard = serials.filter((serial) => serial.region === "AMERICAS");
  const eRegion = serials.filter((serial) => serial.region === "E");
  const standardConfirmed = standard.filter(
    (serial) => serial.status === "confirmed"
  ).length;
  const eConfirmed = eRegion.filter(
    (serial) => serial.status === "confirmed"
  ).length;
  const totalConfirmed = standardConfirmed + eConfirmed;
  const percentage = ((totalConfirmed / 200) * 100).toFixed(1);

  return (
    <main>
      <Link href="/" className="back-link">← Back to Registry</Link>

      <div className="card-detail-header">
        {card.image_url && (
          <img src={card.image_url} alt={card.name} className="card-detail-image" />
        )}

        <div className="card-detail-copy">
          <p className="eyebrow">Magnificent Monsters</p>
          <h1>{card.name}</h1>
          <h2>{totalConfirmed} / 200 confirmed</h2>
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

      <section className="serial-section">
        <div className="serial-section-heading">
          <h2>Americas</h2>
          <strong>{standardConfirmed} / 100 confirmed</strong>
        </div>
        <SerialGrid serials={standard} />
      </section>

      <section className="serial-section">
        <div className="serial-section-heading">
          <h2>Europe-distributed</h2>
          <strong>{eConfirmed} / 100 confirmed</strong>
        </div>
        <SerialGrid serials={eRegion} />
      </section>
    </main>
  );
}
