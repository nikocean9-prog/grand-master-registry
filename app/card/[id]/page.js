export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import SerialGrid from "../../components/SerialGrid";
import PublicHeader from "../../components/PublicHeader";
import { getEvidencePath } from "../../lib/evidenceUrl";
import { getMagnificentMonstersCatalogImage } from "../../lib/magnificentMonstersCatalog";
import { getMagnificentMaestrosCatalogImage } from "../../lib/magnificentMaestrosCatalog";
import { getTcgCardAspectRatio, getTcgCardBack } from "../../lib/tcgCardBacks";

function GradingMarketPanel() {
  return (
    <aside className="grading-market-panel" aria-labelledby="grading-market-heading">
      <h2 id="grading-market-heading">Grading &amp; market</h2>
      <div className="grading-columns">
        <section>
          <h4>PSA</h4>
          <dl>
            <div><dt>10</dt><dd>-</dd></div>
            <div><dt>9</dt><dd>-</dd></div>
          </dl>
        </section>
        <section>
          <h4>Beckett</h4>
          <dl>
            <div><dt>Black Label 10</dt><dd>-</dd></div>
            <div><dt>Pristine 10</dt><dd>-</dd></div>
          </dl>
        </section>
      </div>
      <dl className="grading-other">
        <div><dt>Other graded</dt><dd>-</dd></div>
      </dl>
      <div className="market-section">
        <h3>Verified market</h3>
        <dl>
          <div><dt>Latest raw sale</dt><dd>$-</dd></div>
          <div><dt>Latest graded sale</dt><dd>$-</dd></div>
          <div><dt>90-day verified sales</dt><dd>-</dd></div>
        </dl>
      </div>
    </aside>
  );
}

async function getCard(id) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data } = await supabase
    .from("cards")
    .select("id, name, image_url, serial_total, card_sets(name, slug, tcg_slug, serial_scheme)")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) return { title: "Card Not Found", robots: { index: false, follow: false } };
  const title = `${card.name} Serialized Card Registry`;
  const description = `Track all ${Number(card.serial_total || 0).toLocaleString()} serial numbers for ${card.name} from ${card.card_sets?.name || "this serialized card release"}, including confirmed pulls and regional variants.`;
  return {
    title,
    description,
    alternates: { canonical: `/card/${card.id}` },
    openGraph: { title, description, url: `/card/${card.id}`, images: card.image_url ? [card.image_url] : [] },
  };
}

export default async function CardPage({ params }) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id, name, image_url, serial_total, card_sets(name, slug, tcg_slug, serial_scheme)")
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
        <PublicHeader />
        <Link href="/" className="back-link">← Back to Registry</Link>
        <h1>Card unavailable</h1>
        <p>This card could not be loaded. Check your connection and try again.</p>
      </main>
    );
  }

  if (!card) {
    return (
      <main>
        <PublicHeader />
        <Link href="/" className="back-link">← Back to Registry</Link>
        <h1>Card not found</h1>
      </main>
    );
  }

  if (serialsError) {
    return (
      <main>
        <PublicHeader />
        <Link href={`/sets/${card.card_sets?.slug || "magnificent-monsters"}`} className="back-link">← Back to Registry</Link>
        <h1>{card.name}</h1>
        <p>Could not load serial numbers.</p>
      </main>
    );
  }

  const tcgSlug = card.card_sets?.tcg_slug;
  const cardBackUrl = getTcgCardBack(tcgSlug);
  const cardAspectRatio = getTcgCardAspectRatio(tcgSlug);
  const enableCardTransition = Boolean(cardBackUrl);
  let serialsWithEvidence = serials;

  if (enableCardTransition) {
    const confirmedIds = serials
      .filter((serial) => serial.status === "confirmed")
      .map((serial) => serial.id);

    if (confirmedIds.length) {
      const confirmedIdBatches = [];
      for (let index = 0; index < confirmedIds.length; index += 100) {
        confirmedIdBatches.push(confirmedIds.slice(index, index + 100));
      }

      const approvedSubmissionResults = await Promise.all(
        confirmedIdBatches.map((confirmedIdBatch) => supabase
          .from("submissions")
          .select("serial_id, photo_url, created_at")
          .in("serial_id", confirmedIdBatch)
          .eq("status", "approved")
          .not("photo_url", "is", null)
          .order("created_at", { ascending: false }))
      );
      const approvedSubmissions = approvedSubmissionResults.flatMap((result) => result.data || []);

      const latestPhotoBySerial = new Map();
      for (const submission of approvedSubmissions || []) {
        if (!latestPhotoBySerial.has(submission.serial_id)) {
          latestPhotoBySerial.set(submission.serial_id, getEvidencePath(submission.photo_url));
        }
      }

      const paths = Array.from(latestPhotoBySerial.values()).filter(Boolean);
      const { data: signedFiles } = paths.length
        ? await supabase.storage.from("submission-evidence").createSignedUrls(paths, 3600)
        : { data: [] };
      const signedByPath = new Map(
        (signedFiles || []).map((file, index) => [paths[index], file.signedUrl])
      );

      serialsWithEvidence = serials.map((serial) => {
        const path = latestPhotoBySerial.get(serial.id);
        return path ? { ...serial, evidence_url: signedByPath.get(path) || null } : serial;
      });
    }
  }

  const standard = serialsWithEvidence.filter((serial) => serial.region === "AMERICAS");
  const eRegion = serialsWithEvidence.filter((serial) => serial.region === "E");
  const worldwide = serialsWithEvidence.filter((serial) => serial.region === "GLOBAL");
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
  const catalogImage = card.card_sets?.slug === "magnificent-monsters"
    ? getMagnificentMonstersCatalogImage(card)
    : card.card_sets?.slug === "magnificent-maestros"
      ? getMagnificentMaestrosCatalogImage(card)
      : card.image_url;
  const cardSummary = {
    name: card.name,
    image_url: catalogImage,
    card_back_url: cardBackUrl,
    card_aspect_ratio: cardAspectRatio,
    enableCardTransition,
  };
  return (
    <main className="card-page">
      <PublicHeader />
      <Link href={`/sets/${card.card_sets?.slug || "magnificent-monsters"}`} className="back-link">← Back to Registry</Link>

      <div className="card-detail-header">
        {catalogImage && (
          <div className="card-detail-image-frame">
            <img src={catalogImage} alt={card.name} className="card-detail-image" />
          </div>
        )}

        <div className="card-detail-copy">
          <p className="eyebrow">{card.card_sets?.tcg_slug === "yugioh" ? "Yu-Gi-Oh! · " : ""}{card.card_sets?.name || "Serial Registry"}</p>
          <h1 className="visually-hidden">{card.name}</h1>
          <div className="card-progress-summary">
            <div className="yugioh-set-tracker-heading">
              <strong>{totalConfirmed.toLocaleString()} / {total.toLocaleString()} confirmed</strong>
              <span>{percentage}% documented</span>
            </div>
            <div className="yugioh-set-progress" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={totalConfirmed}>
              <span style={{ width: `${percentage}%` }} />
            </div>
          </div>
        </div>

        <GradingMarketPanel />
      </div>

      <div className="serial-registry-heading">
        <h2>Serial number registry</h2>
      </div>

      {isGlobal ? <section className="serial-section">
        <div className="serial-section-heading">
          <h2>Worldwide</h2>
          <strong>{worldwideConfirmed} / {total.toLocaleString()} confirmed</strong>
        </div>
        <SerialGrid serials={worldwide} total={total} cardSummary={cardSummary} isYugioh={tcgSlug === "yugioh"} />
      </section> : <><section className="serial-section">
        <div className="serial-section-heading">
          <h2>Americas</h2>
          <strong>{standardConfirmed} / 100 confirmed</strong>
        </div>
        <SerialGrid serials={standard} total={100} cardSummary={cardSummary} isYugioh={tcgSlug === "yugioh"} />
      </section>

      <section className="serial-section">
        <div className="serial-section-heading">
          <h2>Europe-distributed</h2>
          <strong>{eConfirmed} / 100 confirmed</strong>
        </div>
        <SerialGrid serials={eRegion} total={100} cardSummary={cardSummary} isYugioh={tcgSlug === "yugioh"} />
      </section></>}
    </main>
  );
}
