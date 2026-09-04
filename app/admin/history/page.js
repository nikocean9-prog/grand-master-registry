"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SubmissionHistory() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/admin";
      return;
    }

    const { data: submissionData, error: submissionError } = await supabase
      .from("submissions")
      .select("*")
      .neq("status", "pending")
      .order("created_at", { ascending: false });

    if (submissionError) {
      setMessage("Could not load submission history.");
      setLoading(false);
      return;
    }

    const completedSubmissions = [];

    for (const submission of submissionData || []) {
      const { data: serial } = await supabase
        .from("serials")
        .select("id, card_id, serial_number, region, status")
        .eq("id", submission.serial_id)
        .single();

      let card = null;

      if (serial) {
        const { data: cardData } = await supabase
          .from("cards")
          .select("id, name")
          .eq("id", serial.card_id)
          .single();

        card = cardData;
      }

      completedSubmissions.push({
        ...submission,
        serial,
        card,
      });
    }

    setSubmissions(completedSubmissions);
    setLoading(false);
  }

  function formatSerial(serial) {
    if (!serial) return "Unknown";

    const number = String(serial.serial_number).padStart(3, "0");
    return serial.region === "E" ? `${number}E` : number;
  }

  function formatRegion(serial) {
    if (!serial) return "Unknown";
    return serial.region === "E" ? "Europe-distributed" : "Americas";
  }

  if (loading) {
    return (
      <main>
        <h1>Submission History</h1>
        <p>Loading history...</p>
      </main>
    );
  }

  return (
    <main>
      <p>
        <a href="/admin/dashboard">← Back to Admin Home</a>
      </p>

      <h1>Submission History</h1>
      <p>All approved and rejected submissions are retained here.</p>

      {message && <p>{message}</p>}

      {submissions.length === 0 ? (
        <p>No completed submissions yet.</p>
      ) : (
        submissions.map((submission) => (
          <div
            key={submission.id}
            style={{
              border:
                submission.status === "approved"
                  ? "2px solid #2e7d32"
                  : "2px solid #777",
              padding: "20px",
              marginBottom: "25px",
            }}
          >
            <h2>{submission.card?.name || "Unknown Card"}</h2>

            <p>
              <strong>Status:</strong>{" "}
              <span
                style={{
                  color:
                    submission.status === "approved" ? "#2e7d32" : "#b71c1c",
                  textTransform: "capitalize",
                  fontWeight: "bold",
                }}
              >
                {submission.status}
              </span>
            </p>

            <p>
              <strong>Serial:</strong> {formatSerial(submission.serial)}
            </p>

            <p>
              <strong>Region:</strong> {formatRegion(submission.serial)}
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

            {submission.notes && (
              <div>
                <p><strong>Notes:</strong></p>
                <p style={{ whiteSpace: "pre-wrap" }}>{submission.notes}</p>
              </div>
            )}

            {submission.submitter_email && (
              <div style={{ marginBottom: "16px" }}>
                <p>
                  <strong>Contact email:</strong>{" "}
                  {submission.submitter_email}
                </p>
                <a
                  href={`mailto:${submission.submitter_email}?subject=${encodeURIComponent(
                    `Grand Master Registry submission: ${
                      submission.card?.name || "Unknown Card"
                    } ${formatSerial(submission.serial)}`
                  )}`}
                  style={{
                    display: "inline-block",
                    border: "1px solid #333",
                    padding: "8px 14px",
                    textDecoration: "none",
                  }}
                >
                  Contact submitter
                </a>
              </div>
            )}

            {submission.source_url && (
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

            {submission.photo_url && (
              <div>
                <p><strong>Photo Evidence:</strong></p>
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
            )}
          </div>
        ))
      )}
    </main>
  );
}
