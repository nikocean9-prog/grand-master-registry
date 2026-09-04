"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
        .select("id, card_id, serial_number, region")
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

      completedSubmissions.push({ ...submission, serial, card });
    }

    setSubmissions(completedSubmissions);
    setLoading(false);
  }

  function formatSerial(serial) {
    if (!serial) return "Unknown";
    const number = String(serial.serial_number).padStart(3, "0");
    return serial.region === "E" ? `${number}E` : number;
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
      <p>Select a submission to view its complete details and evidence.</p>

      {message && <p>{message}</p>}

      {submissions.length === 0 ? (
        <p>No completed submissions yet.</p>
      ) : (
        submissions.map((submission) => (
          <Link
            key={submission.id}
            href={`/admin/history/${submission.id}`}
            style={{
              display: "block",
              border: "1px solid #ccc",
              borderLeft:
                submission.status === "approved"
                  ? "5px solid #2e7d32"
                  : "5px solid #b71c1c",
              padding: "12px 15px",
              marginBottom: "10px",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "10px 25px",
              }}
            >
              <strong style={{ minWidth: "180px", flex: "1 1 220px" }}>
                {submission.card?.name || "Unknown Card"}
              </strong>

              <span style={{ minWidth: "70px" }}>
                {formatSerial(submission.serial)}
              </span>

              <span style={{ minWidth: "170px" }}>
                {submission.created_at
                  ? new Date(submission.created_at).toLocaleString()
                  : "Unknown date"}
              </span>

              <strong
                style={{
                  minWidth: "80px",
                  color:
                    submission.status === "approved" ? "#2e7d32" : "#b71c1c",
                  textTransform: "capitalize",
                }}
              >
                {submission.status}
              </strong>
            </div>
          </Link>
        ))
      )}
    </main>
  );
}
