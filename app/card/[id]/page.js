export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

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
        <Link href="/">← Back to Registry</Link>
        <h1>Card not found</h1>
      </main>
    );
  }

  if (serialsError) {
    return (
      <main>
        <Link href="/">← Back to Registry</Link>
        <h1>{card.name}</h1>
        <p>Could not load serial numbers.</p>
      </main>
    );
  }

  const standard = serials.filter(
    (serial) => serial.region === "AMERICAS"
  );
  const eRegion = serials.filter((serial) => serial.region === "E");
  const standardConfirmed = standard.filter(
    (serial) => serial.status === "confirmed"
  ).length;
  const eConfirmed = eRegion.filter(
    (serial) => serial.status === "confirmed"
  ).length;
  const totalConfirmed = standardConfirmed + eConfirmed;

  const formatNumber = (number, region) => {
    const formatted = String(number).padStart(3, "0");
    return region === "E" ? `${formatted}E` : formatted;
  };

  const SerialGrid = ({ serials }) => (
    <div className="serial-grid">
      {serials.map((serial) => {
        const serialLabel = formatNumber(
          serial.serial_number,
          serial.region
        );

        if (serial.status === "confirmed") {
          return (
            <Link
              key={`${serial.region}-${serial.serial_number}`}
              href={`/serial/${serial.id}`}
              className={`serial-box ${serial.status}`}
            >
              {serialLabel}
            </Link>
          );
        }

        return (
          <div
            key={`${serial.region}-${serial.serial_number}`}
            className={`serial-box ${serial.status}`}
          >
            {serialLabel}
          </div>
        );
      })}
    </div>
  );

  return (
    <main>
      <Link href="/">← Back to Registry</Link>

      <div className="card-detail-header">
        {card.image_url && (
          <img
            src={card.image_url}
            alt={card.name}
            className="card-detail-image"
          />
        )}

        <div>
          <h1>{card.name}</h1>
          <h2>{totalConfirmed} / 200 Confirmed</h2>
        </div>
      </div>

      <section>
        <h2>Americas</h2>
        <p>{standardConfirmed} / 100 confirmed</p>
        <SerialGrid serials={standard} />
      </section>

      <section>
        <h2>Europe-distributed</h2>
        <p>{eConfirmed} / 100 confirmed</p>
        <SerialGrid serials={eRegion} />
      </section>
    </main>
  );
}
