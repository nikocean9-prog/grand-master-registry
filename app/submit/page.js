"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SubmitPage() {
  const [cards, setCards] = useState([]);
  const [cardId, setCardId] = useState("");
  const [region, setRegion] = useState("AMERICAS");
  const [serialNumber, setSerialNumber] = useState("1");
  const [country, setCountry] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [photo, setPhoto] = useState(null);
  const [country, setCountry] = useState("");
const [sourceUrl, setSourceUrl] = useState("");
const [message, setMessage] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCards() {
      const { data } = await supabase
        .from("cards")
        .select("id, name")
        .order("id");

      setCards(data || []);
    }

    loadCards();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!photo) {
      setMessage("Please upload a photo of the card.");
      return;
    }

    setSubmitting(true);

    const { data: serial, error: serialError } = await supabase
      .from("serials")
      .select("id")
      .eq("card_id", cardId)
      .eq("region", region)
      .eq("serial_number", Number(serialNumber))
      .single();

    if (serialError || !serial) {
      setMessage("Could not find that serial number.");
      setSubmitting(false);
      return;
    }

    const fileExtension = photo.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExtension}`;

    const filePath = `submissions/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("submission-evidence")
      .upload(filePath, photo);

    if (uploadError) {
      setMessage("Photo could not be uploaded.");
      setSubmitting(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("submission-evidence")
      .getPublicUrl(filePath);

    const photoUrl = publicUrlData.publicUrl;

    const { error } = await supabase
      .from("submissions")
      .insert({
        serial_id: serial.id,
        photo_url: photoUrl,
        country: country || null,
        source_url: sourceUrl || null,
        status: "pending",
      });

    if (error) {
      setMessage("Submission could not be sent.");
      setSubmitting(false);
      return;
    }

    setMessage("Pull submitted for verification.");
    setCardId("");
    setRegion("AMERICAS");
    setSerialNumber("1");
    setCountry("");
    setSourceUrl("");
    setPhoto(null);
    setSubmitting(false);

    event.target.reset();
  }

  return (
    <main>
      <Link href="/">← Back to Registry</Link>

      <h1>Submit a Pull</h1>

      <p>
        Report a Magnificent Monsters Grand Master Rare that has been pulled.
      </p>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Card</label>
          <br />
          <select
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            required
          >
            <option value="">Select a card</option>

            {cards.map((card) => (
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

        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit for Verification"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </main>
  );
}
