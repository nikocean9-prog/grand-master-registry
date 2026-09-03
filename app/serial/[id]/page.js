
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export default async function SerialPage({ params }) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: serial, error: serialError } = await supabase
    .from("serials")
    .select("id, card_id, serial_number, region, status, confirmed_at")
    .eq("id", id)
    .single();

  if (serialError || !serial || serial.status !== "confirmed") {
    return (
      <main>
        <Link href="/">← Back to Registry</Link>
        <h1>Serial not found</h1>
      </main>
    );
  }

  const { data: card } = await supabase
    .from("cards")
    .select("id, name")
    .eq("id", serial.card_id)
    .single();

  const { data: submission } = await supabase
    .from("submissions")
    .select("photo_url, country, source_url, created_at, status")
    .eq("serial_id", serial.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const serialNumber = String(serial.serial_number).padStart(3, "0");

  const serialLabel =
    serial.region === "E" ? `${serialNumber}E` : serialNumber;

  const regionLabel =
    serial.region === "E"
      ? "Europe-distributed"
      : "Americas";

  return (
    <main>
      <p>
        <Link href={`/card/${serial.card_id}`}>
          ← Back to {card?.name || "Card"}
        </Link>
      </p>

      <h1>{card?.name || "Grand Master Rare"}</h1>

      <h2>Serial {serialLabel}</h2>

      <p>
        <strong>Status:</strong> Confirmed
      </p>

      <p>
        <strong>Region:</strong> {regionLabel}
      </p>

      {submission?.country && (
        <p>
          <strong>Country:</strong> {submission.country}
        </p>
      )}

      {serial.confirmed_at && (
        <p>
          <strong>Confirmed:</strong>{" "}
          {new Date(serial.confirmed_at).toLocaleDateString()}
        </p>
      )}

      {submission?.source_url && (
        <p>
          <strong>Source:</strong>{" "}
          <a
            href={submission.source_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View source
          </a>
        </p>
      )}

      {submission?.photo_url ? (
        <div>
          <h2>Evidence Photo</h2>

          <a
            href={submission.photo_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={submission.photo_url}
              alt={`${card?.name || "Grand Master Rare"} ${serialLabel}`}
              style={{
                display: "block",
                maxWidth: "600px",
                width: "100%",
                height: "auto",
              }}
            />
          </a>
        </div>
      ) : (
        <p>No public evidence photo available.</p>
      )}
    </main>
  );
}
