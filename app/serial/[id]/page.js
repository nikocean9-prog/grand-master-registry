export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { getEvidenceUrl } from "../../lib/evidenceUrl";

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

  if (serialError && serialError.code !== "PGRST116") {
    return (
      <main>
        <Link href="/" className="back-link">← Back to Registry</Link>
        <h1>Serial unavailable</h1>
        <p>This serial could not be loaded. Check your connection and try again.</p>
      </main>
    );
  }

  if (!serial || serial.status !== "confirmed") {
    return (
      <main>
        <Link href="/" className="back-link">← Back to Registry</Link>
        <h1>Serial not found</h1>
      </main>
    );
  }

  const { data: card } = await supabase
    .from("cards")
    .select("id, name, image_url, serial_total")
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

  const evidenceUrl = await getEvidenceUrl(supabase, submission?.photo_url);
  const serialNumber = String(serial.serial_number).padStart((card?.serial_total || 100) < 100 ? 2 : 3, "0");
  const serialLabel = serial.region === "E" ? `${serialNumber}E` : serialNumber;
  const regionLabel = serial.region === "GLOBAL"
    ? "Worldwide"
    : serial.region === "E" ? "Europe-distributed" : "Americas";

  return (
    <main>
      <Link href={`/card/${serial.card_id}`} className="back-link">
        ← Back to {card?.name || "Card"}
      </Link>

      <div className="serial-page-heading">
        {card?.image_url && (
          <img src={card.image_url} alt="" className="serial-card-thumbnail" />
        )}
        <div>
          <span className="confirmed-badge">Confirmed</span>
          <h1>{card?.name || "Grand Master Rare"}</h1>
          <p className="serial-title">Serial {serialLabel}</p>
        </div>
      </div>

      <div className="serial-detail-layout">
        <section className="serial-info-card">
          <h2>Registry details</h2>
          <dl>
            <div><dt>Serial</dt><dd>{serialLabel}</dd></div>
            <div><dt>Region</dt><dd>{regionLabel}</dd></div>
            {submission?.country && (
              <div><dt>Country</dt><dd>{submission.country}</dd></div>
            )}
            {serial.confirmed_at && (
              <div>
                <dt>Confirmed</dt>
                <dd>{new Date(serial.confirmed_at).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>

          {submission?.source_url && (
            <a
              href={submission.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              View original source ↗
            </a>
          )}
        </section>

        <section className="evidence-panel">
          {evidenceUrl ? (
            <a href={evidenceUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={evidenceUrl}
                alt={`${card?.name || "Grand Master Rare"} ${serialLabel}`}
                className="evidence-image"
              />
            </a>
          ) : (
            <p>No public card photo available.</p>
          )}
        </section>
      </div>
    </main>
  );
}
