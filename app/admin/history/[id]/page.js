"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SubmissionHistoryDetails() {
  const params = useParams();
  const submissionId = params?.id;
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (submissionId) {
      loadSubmission();
    }
  }, [submissionId]);

  async function loadSubmission() {
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

    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (error || !data) {
      setMessage("Could not load this submission.");
      setLoading(false);
      return;
    }

    const { data: serial } = await supabase
      .from("serials")
      .select("id, card_id, serial_number, region")
      .eq("id", data.serial_id)
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

    setSubmission({ ...data, serial, card });
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
        <h1>Submission Details</h1>
        <p>Loading submission...</p>
      </main>
    );
  }

  if (!submission) {
    return (
      <main>
        <p>
          <a href="/admin/history">← Back to Submission History</a>
        </p>
        <h1>Submission Details</h1>
        <p>{message || "Submission not found."}</p>
      </main>
    );
  }

  return (
    <main>
      <p>
        <a href="/admin/history">← Back to Submission History</a>
      </p>

      <h1>{submission.card?.name || "Unknown Card"}</h1>

      <div
        style={{
          border:
            submission.status === "approved"
              ? "2px solid #2e7d32"
              : "2px solid #b71c1c",
          padding: "20px",
        }}
      >
        <p>
          <strong>Status:</strong>{" "}
          <strong
            style={{
              color:
                submission.status === "approved" ? "#2e7d32" : "#b71c1c",
              textTransform: "capitalize",
            }}
          >
            {submission.status}
          </strong>
        </p>

        <p><strong>Serial:</strong> {formatSerial(submission.serial)}</p>
        <p><strong>Region:</strong> {formatRegion(submission.serial)}</p>
        <p>
          <strong>Country:</strong> {submission.country || "Not provided"}
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
              <strong>Contact email:</strong> {submission.submitter_email}
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
                  maxWidth: "500px",
                  width: "100%",
                  height: "auto",
                }}
              />
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
