"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      // Check that the admin is signed in
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/admin";
        return;
      }

      // Load pending submissions
      const { data: submissionData, error: submissionError } =
        await supabase
          .from("submissions")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: true });

      if (submissionError) {
        setMessage("Could not load submissions.");
        setLoading(false);
        return;
      }

      const completedSubmissions = [];

      // Load the serial and card information for each submission
      for (const submission of submissionData || []) {
        const { data: serial, error: serialError } = await supabase
          .from("serials")
          .select("id, card_id, serial_number, region, status")
          .eq("id", submission.serial_id)
          .single();

        let card = null;

        if (!serialError && serial) {
          const { data: cardData } = await supabase
            .from("cards")
            .select("id, name")
            .eq("id", serial.card_id)
            .single();

          card = cardData;
        }

        completedSubmissions.push({
          ...submission,
          serial: serial || null,
          card: card || null,
        });
      }

      setSubmissions(completedSubmissions);
      setLoading(false);
    }

    loadDashboard();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  function formatSerial(serial) {
    if (!serial) {
      return "Unknown";
    }

    const number = String(serial.serial_number).padStart(3, "0");

    if (serial.region === "E") {
      return `${number}E`;
    }

    return number;
  }

  function formatRegion(serial) {
    if (!serial) {
      return "Unknown";
    }

    if (serial.region === "E") {
      return "Europe-distributed";
    }

    return "Americas";
  }

  if (loading) {
    return (
      <main>
        <h1>Admin Dashboard</h1>
        <p>Loading submissions...</p>
      </main>
    );
  }

  return (
    <main>
      <p>
        <a href="/">← Back to Registry</a>
      </p>

      <h1>Admin Dashboard</h1>

      <button type="button" onClick={handleSignOut}>
        Sign Out
      </button>

      <hr />

      <h2>Pending Submissions</h2>

      {message && <p>{message}</p>}

      {submissions.length === 0 ? (
        <p>No pending submissions.</p>
      ) : (
        <div>
          {submissions.map((submission) => (
            <div
              key={submission.id}
              style={{
                border: "1px solid #ccc",
                padding: "20px",
                marginBottom: "25px",
              }}
            >
              <h2>
                {submission.card
                  ? submission.card.name
                  : "Unknown Card"}
              </h2>

              <p>
                <strong>Serial:</strong>{" "}
                {formatSerial(submission.serial)}
              </p>

              <p>
                <strong>Region:</strong>{" "}
                {formatRegion(submission.serial)}
              </p>

              <p>
                <strong>Country:</strong>{" "}
                {submission.country || "Not provided"}
              </p>

              <p>
                <strong>Submitted:</strong>{" "}
                {submission.created_at
                  ? new Date(submission.created_at).toLocaleString()
                  : "Unknown"}
              </p>

              {submission.source_url ? (
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
              ) : null}

              {submission.photo_url ? (
                <div>
                  <p>
                    <strong>Photo Evidence:</strong>
                  </p>

                  <a
                    href={submission.photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={submission.photo_url}
                      alt="Submission evidence"
                      style={{
                        display: "block",
                        maxWidth: "400px",
                        width: "100%",
                        height: "auto",
                      }}
                    />
                  </a>
                </div>
              ) : (
                <p>No photo provided.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
