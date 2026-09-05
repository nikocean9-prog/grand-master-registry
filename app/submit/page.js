"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { safeSubmissionMessage } from "../lib/userMessages";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SubmitPage() {
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
  const [notes, setNotes] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [cardsError, setCardsError] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      const { data: liveSets, error: setsError } = await supabase
        .from("card_sets")
        .select("id, name")
        .eq("status", "live")
        .order("release_date");

      if (setsError || !liveSets?.length) {
        setCardsError(true);
        return;
      }

      const { data, error } = await supabase
        .from("cards")
        .select("id, name, set_id")
        .in("set_id", liveSets.map((cardSet) => cardSet.id))
        .order("id");

      if (error) {
        setCardsError(true);
        return;
      }

      setSets(liveSets);
      setSetId(String(liveSets[0].id));
      setCards(data || []);
    }
    loadCatalog();
  }, []);

  useEffect(() => {
    async function checkSerialStatus() {
      setSerialStatus(null);

      if (!cardId || !serialNumber || !region) {
        return;
      }

      const serialValue = Number(serialNumber);

      if (
        !Number.isInteger(serialValue) ||
        serialValue < 1 ||
        serialValue > 100
      ) {
        return;
      }

      const { data: serial, error } = await supabase
  .from("serials")
  .select("id, status, region, serial_number")
  .eq("card_id", Number(cardId))
  .eq("region", region)
  .eq("serial_number", serialValue)
  .maybeSingle();

if (error) {
  console.error("Serial status check failed:", error);
  return;
}

if (serial) {
  setSerialStatus(serial.status);
} else {
  setSerialStatus(null);
}
    }

    checkSerialStatus();
  }, [cardId, region, serialNumber]);

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

    try {
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

      const submissionForm = new FormData();
      submissionForm.append("serial_id", String(serial.id));
      submissionForm.append("photo", photo);
      submissionForm.append("country", country);
      submissionForm.append("source_url", sourceUrl);
      submissionForm.append("notes", notes);
      submissionForm.append("submitter_email", submitterEmail.trim());
      submissionForm.append("website", honeypotValue);

      const { error } = await supabase.functions.invoke("submit-pull", {
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

      setMessage("Pull submitted for verification.");
      setCardId("");
      setRegion("AMERICAS");
      setSerialNumber("1");
      setCountry("");
      setSourceUrl("");
      setNotes("");
      setSubmitterEmail("");
      setPhoto(null);
      form.reset();
    } catch (error) {
      setMessage(safeSubmissionMessage("", error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <Link href="/sets/magnificent-monsters">← Back to Registry</Link>

      <h1>Submit a Pull</h1>

      <p>Report a serial-numbered card that has been pulled.</p>

      {cardsError && (
        <p role="alert">
          The card list could not be loaded. Check your connection and refresh the page.
        </p>
      )}

      <form onSubmit={handleSubmit}>
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
        {sets.length > 1 && <><div>
          <label>Set</label>
          <br />
          <select value={setId} onChange={(event) => { setSetId(event.target.value); setCardId(""); }} required>
            {sets.map((cardSet) => <option key={cardSet.id} value={cardSet.id}>{cardSet.name}</option>)}
          </select>
        </div><br /></>}
        <div>
          <label>Card</label>
          <br />
          <select
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
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

        <br />

        <div>
          <label>Region</label>
          <br />
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="AMERICAS">Americas — 001 to 100</option>
            <option value="E">E-Region — 001E to 100E</option>
          </select>
        </div>

        <br />

        <div>
          <label>Serial Number</label>
          <br />
          <select
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
          >
            {Array.from({ length: 100 }, (_, i) => i + 1).map((number) => (
              <option key={number} value={number}>
                {String(number).padStart(3, "0")}
                {region === "E" ? "E" : ""}
              </option>
            ))}
          </select>
             </div>

      {serialStatus === "confirmed" && (
        <div
          style={{
            border: "1px solid #d6a700",
            padding: "15px",
            marginBottom: "20px",
          }}
        >
          <strong>This serial is already listed as confirmed.</strong>

          <p style={{ marginBottom: 0 }}>
            If you believe the existing record is incorrect or invalid,
            please provide details in the notes section and upload any
            relevant photos or evidence.
          </p>
        </div>
      )}

      <br />

      <div>
        <label>Photo Evidence</label>
          <br />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            required
          />
          <p className="photo-processing-notice">
            Submitted photos are checked automatically using OpenAI to help
            identify unreadable details, mismatches, possible editing, and
            duplicate evidence. Images that clearly do not show the selected
            database card may be rejected before submission. Unclear results
            are sent to an administrator for review. Contact details are not
            sent to OpenAI.
          </p>
        </div>

        <br />

        <div>
          <label>Country (optional)</label>
          <br />
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Australia"
          />
        </div>

        <br />

        <div>
          <label>Source link (optional)</label>
          <br />
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <br />
<div>
  <label>Notes (optional)</label>
  <br />
  <textarea
    value={notes}
    onChange={(e) => setNotes(e.target.value)}
    placeholder="Add any additional information about this pull or existing record..."
    rows="5"
    style={{ width: "100%", maxWidth: "500px" }}
  />
</div>

<br />

        <div>
          <label>
            Email{serialStatus === "confirmed" ? " (required)" : " (optional)"}
          </label>
          <br />
          <input
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

        <br />

        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit for Verification"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </main>
  );
}
