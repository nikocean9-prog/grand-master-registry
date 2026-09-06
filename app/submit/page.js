"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { safeSubmissionMessage } from "../lib/userMessages";
import { tcgs as tcgCatalog } from "../lib/catalog";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function preparePhotoForUpload(file) {
  const bitmap = await createImageBitmap(file);
  const maxDimension = 1024;
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("This browser could not prepare the photo.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("The photo could not be prepared.")),
      "image/jpeg",
      0.76
    );
  });
  const baseName = file.name.replace(/\.[^.]+$/, "") || "card-photo";

  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export default function SubmitPage() {
  const [tcgSlug, setTcgSlug] = useState("");
  const [sets, setSets] = useState([]);
  const [setId, setSetId] = useState("");
  const [cards, setCards] = useState([]);
  const [cardId, setCardId] = useState("");
  const [region, setRegion] = useState("AMERICAS");
  const [serialNumber, setSerialNumber] = useState("1");
  const [country, setCountry] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serialStatus, setSerialStatus] = useState(null);
  const [serialStatuses, setSerialStatuses] = useState({});
  const [notes, setNotes] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [cardsError, setCardsError] = useState(false);
  const [clientRequestId, setClientRequestId] = useState("");

  useEffect(() => {
    async function loadCatalog() {
      const { data: liveSets, error: setsError } = await supabase
        .from("card_sets")
        .select("id, name, serial_scheme, tcg_slug")
        .eq("status", "live")
        .order("release_date");

      if (setsError || !liveSets?.length) {
        setCardsError(true);
        return;
      }

      const { data, error } = await supabase
        .from("cards")
        .select("id, name, set_id, serial_total, image_url")
        .in("set_id", liveSets.map((cardSet) => cardSet.id))
        .order("id");

      if (error) {
        setCardsError(true);
        return;
      }

      const firstTcgSlug = liveSets[0].tcg_slug;
      const firstSet = liveSets.find((cardSet) => cardSet.tcg_slug === firstTcgSlug);

      setSets(liveSets);
      setTcgSlug(firstTcgSlug);
      setSetId(String(firstSet.id));
      setCards(data || []);
      setRegion(firstSet.serial_scheme === "global" ? "GLOBAL" : "AMERICAS");
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    async function loadSerialStatuses() {
      setSerialStatus(null);
      setSerialStatuses({});

      if (!cardId || !region) {
        return;
      }

      const { data: serial, error } = await supabase
        .from("serials")
        .select("status, serial_number")
        .eq("card_id", Number(cardId))
        .eq("region", region);

      if (error) {
        console.error("Serial status check failed:", error);
        return;
      }

      const nextStatuses = Object.fromEntries(
        (serial || []).map((item) => [String(item.serial_number), item.status])
      );
      setSerialStatuses(nextStatuses);
      setSerialStatus(nextStatuses[String(Number(serialNumber))] || null);
    }

    loadSerialStatuses();
  }, [cardId, region]);

  useEffect(() => {
    setSerialStatus(serialStatuses[String(Number(serialNumber))] || null);
  }, [serialNumber, serialStatuses]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const honeypotValue = form.elements.website?.value || "";
    setMessage("");

    if (!photo) {
      setMessage("Please upload a photo of the card.");
      return;
    }

    if (!photo.type.startsWith("image/") || photo.size > 10 * 1024 * 1024) {
      setMessage("Photo must be an image no larger than 10 MB.");
      return;
    }

    if (serialStatus === "confirmed" && !submitterEmail.trim()) {
      setMessage(
        "Please enter your email address when challenging an already-confirmed serial."
      );
      return;
    }

    setSubmitting(true);
    setMessage("Submission received and is being reviewed…");

    try {
      const preparedPhoto = await preparePhotoForUpload(photo);

      if (preparedPhoto.size > 6 * 1024 * 1024) {
        setMessage("This photo is still too large after processing. Please choose a smaller image.");
        return;
      }

      const { data: serial, error: serialError } = await supabase
        .from("serials")
        .select("id")
        .eq("card_id", cardId)
        .eq("region", region)
        .eq("serial_number", Number(serialNumber))
        .single();

      if (serialError || !serial) {
        setMessage("Could not find that serial number.");
        return;
      }

      const activeRequestId = clientRequestId || crypto.randomUUID();
      if (!clientRequestId) setClientRequestId(activeRequestId);

      const submissionForm = new FormData();
      submissionForm.append("client_request_id", activeRequestId);
      submissionForm.append("serial_id", String(serial.id));
      submissionForm.append("photo", preparedPhoto);
      submissionForm.append("country", country);
      submissionForm.append("source_url", sourceUrl);
      submissionForm.append("notes", notes);
      submissionForm.append("submitter_email", submitterEmail.trim());
      submissionForm.append("website", honeypotValue);

      const { data, error } = await supabase.functions.invoke("submit-pull", {
        body: submissionForm,
      });

      if (error) {
        let serverMessage = "";

        if (error.context instanceof Response) {
          try {
            const responseBody = await error.context.json();
            serverMessage = responseBody?.error || "";
          } catch {
            // Keep the safe fallback message.
          }
        }

        setMessage(safeSubmissionMessage(serverMessage, error));
        return;
      }

      setMessage("Submission received and is being reviewed…");

      let reviewStatus = data?.review_status || "reviewing";

      if (data?.submission_id && data?.receipt) {
        const reviewStartedAt = Date.now();

        while (reviewStatus === "reviewing" && Date.now() - reviewStartedAt < 8_000) {
          await wait(650);
          const { data: statusData, error: statusError } =
            await supabase.functions.invoke("submit-pull", {
              body: {
                action: "review-status",
                submission_id: data.submission_id,
                receipt: data.receipt,
              },
            });

          if (statusError) break;
          reviewStatus = statusData?.review_status || "reviewing";
        }
      }

      if (reviewStatus === "rejected") {
        setMessage(
          "Photo not accepted. Please check that it clearly shows the selected trading card and try again."
        );
        setClientRequestId("");
        setSubmitting(false);
        return;
      }

      if (reviewStatus === "manual") {
        setMessage(
          "Submission received. The automated check was uncertain, so it will be reviewed manually."
        );
      } else if (reviewStatus === "accepted") {
        setMessage(
          "Accepted for verification. Your submission is now awaiting admin approval."
        );
      } else {
        setMessage(
          "Submission received and is still being reviewed. It will not appear publicly unless approved."
        );
      }

      setSubmitting(false);
      setCardId("");
      setRegion(sets.find((cardSet) => String(cardSet.id) === setId)?.serial_scheme === "global" ? "GLOBAL" : "AMERICAS");
      setSerialNumber("1");
      setCountry("");
      setSourceUrl("");
      setNotes("");
      setSubmitterEmail("");
      setPhoto(null);
      setClientRequestId("");
      form.reset();
    } catch (error) {
      setMessage(safeSubmissionMessage("", error));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSet = sets.find((cardSet) => String(cardSet.id) === setId);
  const selectedCard = cards.find((card) => String(card.id) === String(cardId));
  const hasRegionalVariants = selectedSet?.serial_scheme !== "global";
  const serialsPerRegion = hasRegionalVariants
    ? Math.ceil((selectedCard?.serial_total || 200) / 2)
    : selectedCard?.serial_total || 100;
  const selectedTcgName =
    tcgCatalog.find((tcg) => tcg.slug === tcgSlug)?.name || tcgSlug;

  return (
    <main className="submission-page">
      <Link href="/" className="submission-back-link">← Back to Home</Link>

      <div className="submission-heading">
        <p className="eyebrow">Document a card</p>
        <h1>Submit a Pull</h1>
        <p>Report a serial-numbered card for review and inclusion in the registry.</p>
      </div>

      {cardsError && (
        <p role="alert">
          The card list could not be loaded. Check your connection and refresh the page.
        </p>
      )}

      <form onSubmit={handleSubmit} className="submission-layout">
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-10000px",
            width: "1px",
            height: "1px",
            overflow: "hidden",
          }}
        >
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex="-1"
            autoComplete="off"
          />
        </div>
        <section className="submission-form-card">
        <div className="submission-fields">
        {sets.length > 0 && <div className="submission-field">
          <label htmlFor="submission-tcg">TCG</label>
          <select value={tcgSlug} onChange={(event) => {
            const nextTcgSlug = event.target.value;
            const nextSet = sets.find((cardSet) => cardSet.tcg_slug === nextTcgSlug);
            setTcgSlug(nextTcgSlug);
            setSetId(nextSet ? String(nextSet.id) : "");
            setCardId("");
            setSerialNumber("1");
            setRegion(nextSet?.serial_scheme === "global" ? "GLOBAL" : "AMERICAS");
          }} required id="submission-tcg">
            {[...new Set(sets.map((cardSet) => cardSet.tcg_slug))].map((slug) => (
              <option key={slug} value={slug}>
                {tcgCatalog.find((tcg) => tcg.slug === slug)?.name || slug}
              </option>
            ))}
          </select>
        </div>}
        {sets.filter((cardSet) => cardSet.tcg_slug === tcgSlug).length > 0 && <div className="submission-field">
          <label htmlFor="submission-set">Set</label>
          <select id="submission-set" value={setId} onChange={(event) => { const nextSetId = event.target.value; setSetId(nextSetId); setCardId(""); setSerialNumber("1"); setRegion(sets.find((cardSet) => String(cardSet.id) === nextSetId)?.serial_scheme === "global" ? "GLOBAL" : "AMERICAS"); }} required>
            {sets.filter((cardSet) => cardSet.tcg_slug === tcgSlug).map((cardSet) => <option key={cardSet.id} value={cardSet.id}>{cardSet.name}</option>)}
          </select>
        </div>}
        <div className="submission-field submission-field-wide">
          <label htmlFor="submission-card">Card</label>
          <select
            id="submission-card"
            value={cardId}
            onChange={(e) => { setCardId(e.target.value); setSerialNumber("1"); }}
            required
            disabled={cardsError}
          >
            <option value="">Select a card</option>

            {cards.filter((card) => String(card.set_id) === setId).map((card) => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </select>
        </div>

        {hasRegionalVariants && <div className="submission-field">
          <label htmlFor="submission-region">Region</label>
          <select
            id="submission-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="AMERICAS">Americas — 001 to 100</option>
            <option value="E">E-Region — 001E to 100E</option>
          </select>
        </div>}

        <div className={`submission-field ${hasRegionalVariants ? "" : "submission-field-wide"}`}>
          <label htmlFor="submission-serial">Serial Number</label>
          <select
            id="submission-serial"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
          >
            {Array.from({ length: serialsPerRegion }, (_, i) => i + 1).map((number) => (
              <option key={number} value={number}>
                {String(number).padStart(serialsPerRegion < 100 ? 2 : 3, "0")}
                {region === "E" ? "E" : ""}{serialStatuses[String(number)] === "confirmed" ? " — already confirmed" : ""}
              </option>
            ))}
          </select>
        </div>

      {serialStatus === "confirmed" && (
        <div className="submission-warning submission-field-wide">
          <strong>This serial is already listed as confirmed.</strong>

          <p style={{ marginBottom: 0 }}>
            If you believe the existing record is incorrect or invalid,
            please provide details in the notes section and upload any
            relevant photos or evidence.
          </p>
        </div>
      )}

      <div className="submission-field submission-field-wide">
        <label htmlFor="submission-photo">Photo evidence</label>
          <div className="submission-upload">
          <input
            id="submission-photo"
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            required
          />
          <span>{photo ? photo.name : "Choose a clear photo showing the full card"}</span>
          </div>
          <p className="photo-processing-notice">
            Submitted photos are checked automatically to help
            identify unreadable details, mismatches, possible editing, and
            duplicate evidence. Images that clearly do not show the selected
            database card may be rejected before submission. Unclear results
            are sent to an administrator for review. Contact details are not
            included in the automated check.
          </p>
        </div>

        <div className="submission-field">
          <label htmlFor="submission-country">Country <small>Optional</small></label>
          <input
            id="submission-country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Australia"
          />
        </div>

        <div className="submission-field">
          <label htmlFor="submission-source">Source link <small>Optional</small></label>
          <input
            id="submission-source"
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

<div className="submission-field submission-field-wide">
  <label htmlFor="submission-notes">Notes <small>Optional</small></label>
  <textarea
    id="submission-notes"
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    placeholder="Add any additional information about this pull or existing record..."
    rows="5"
  />
</div>

        <div className="submission-field submission-field-wide">
          <label htmlFor="submission-email">
            Email <small>{serialStatus === "confirmed" ? "Required" : "Optional"}</small>
          </label>
          <input
            id="submission-email"
            type="email"
            value={submitterEmail}
            onChange={(e) => setSubmitterEmail(e.target.value)}
            placeholder="your@email.com"
            required={serialStatus === "confirmed"}
          />
          {serialStatus === "confirmed" ? (
            <p className="email-guidance important">
              Email is required for this challenge so the registry administrator
              can contact you for additional evidence. It will never be displayed publicly.
            </p>
          ) : (
            <p className="email-guidance">
              <strong>Email is recommended.</strong> Without it, we cannot contact
              you if the photo needs clarification, and your submission may be
              rejected if the evidence is insufficient. Your email will never be
              displayed publicly.
            </p>
          )}
        </div>

        <button type="submit" disabled={submitting} className="submission-button submission-field-wide">
          {submitting ? "Submitting..." : "Submit for Verification"}
        </button>
        </div>
        </section>

        <aside className="submission-preview">
          <div className="submission-preview-image">
            {selectedCard?.image_url ? (
              <img src={selectedCard.image_url} alt={selectedCard.name} />
            ) : (
              <span>Select a card to preview it here</span>
            )}
          </div>
          <p className="eyebrow">Selected card</p>
          <h2>{selectedCard?.name || "No card selected"}</h2>
          <dl>
            <div><dt>TCG</dt><dd>{selectedTcgName || "—"}</dd></div>
            <div><dt>Set</dt><dd>{selectedSet?.name || "—"}</dd></div>
            {hasRegionalVariants && <div><dt>Region</dt><dd>{region === "E" ? "E-Region" : "Americas"}</dd></div>}
            <div><dt>Serial</dt><dd>{String(serialNumber).padStart(serialsPerRegion < 100 ? 2 : 3, "0")}{region === "E" ? "E" : ""}</dd></div>
          </dl>
        </aside>
      </form>

      {message && <p className="submission-message" role="status">{message}</p>}
    </main>
  );
}
