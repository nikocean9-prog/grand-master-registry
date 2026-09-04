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
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
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

  async function handleApprove(submissionId) {
    setBusyId(submissionId);
    setMessage("");

    const { error } = await supabase.rpc("approve_submission", {
      p_submission_id: submissionId,
    });

    if (error) {
      setMessage(`Approval failed: ${error.message}`);
      setBusyId(null);
      return;
    }

    setMessage("Submission approved.");
    await loadDashboard();
    setBusyId(null);
  }

  async function handleReject(submissionId) {
    const confirmed = window.confirm(
      "Are you sure you want to reject this submission?"
    );

    if (!confirmed) {
      return;
    }

    setBusyId(submissionId);
    setMessage("");

    const { error } = await supabase.rpc("reject_submission", {
      p_submission_id: submissionId,
    });

    if (error) {
      setMessage(`Rejection failed: ${error.message}`);
      setBusyId(null);
      return;
    }

    setMessage("Submission rejected.");
    await loadDashboard();
    setBusyId(null);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  function formatSerial(serial) {
    if (!serial) return "Unknown";

    const number = String(serial.serial_number).padStart(3, "0");

    return serial.region === "E" ? `${number}E` : number;
  }

  function formatRegion(serial) {
    if (!serial) return "Unknown";

    return serial.region === "E"
      ? "Europe-distributed"
      : "Americas";
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
        submissions.map((submission) => (
          <div
            key={submission.id}
            style={{
              border:
                submission.serial?.status === "confirmed"
                  ? "3px solid #c62828"
                  : "1px solid #ccc",
              padding: "20px",
              marginBottom: "25px",
            }}
          >
            <h2>{submission.card?.name || "Unknown Card"}</h2>

            <p>
              <strong>Serial:</strong>{" "}
              {formatSerial(submission.serial)}
            </p>

            <p>
              <strong>Region:</strong>{" "}
              {formatRegion(submission.serial)}
            </p>

            {submission.serial?.status === "confirmed" && (
              <div
                style={{
                  border: "1px solid #d6a700",
                  backgroundColor: "#fff8d6",
                  color: "#5f4900",
                  padding: "15px",
                  marginBottom: "20px",
                }}
              >
                <strong>Warning: This serial has already been confirmed.</strong>
                <p style={{ marginBottom: 0 }}>
                  Approving this submission may replace the existing public
                  record. Check the current evidence before continuing.
                </p>
              </div>
            )}

            <p>
              <strong>Country:</strong>{" "}
              {submission.country || "Not provided"}
            </p>

            {submission.notes && (
              <div>
                <p>
                  <strong>Notes:</strong>
                </p>
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {submission.notes}
                </p>
              </div>
            )}

            <p>
              <strong>Submitted:</strong>{" "}
              {submission.created_at
                ? new Date(submission.created_at).toLocaleString()
                : "Unknown"}
            </p>

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
            )}

            <div style={{ marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => handleApprove(submission.id)}
                disabled={busyId === submission.id}
                style={{
                  marginRight: "10px",
                  padding: "10px 18px",
                }}
              >
                {busyId === submission.id
                  ? "Processing..."
                  : "Approve"}
              </button>

              <button
                type="button"
                onClick={() => handleReject(submission.id)}
                disabled={busyId === submission.id}
                style={{
                  padding: "10px 18px",
                }}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
