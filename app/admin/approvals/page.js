"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../../lib/adminAuth";
import { getEvidenceUrl } from "../../lib/evidenceUrl";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminApprovals() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  async function loadApprovals() {
    setLoading(true);
    setMessage("");

    const admin = await getCurrentAdmin(supabase);

    if (!admin) {
      await supabase.auth.signOut();
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

      const evidenceUrl = await getEvidenceUrl(
        supabase,
        submission.photo_url
      );

      completedSubmissions.push({
        ...submission,
        serial,
        card,
        evidence_url: evidenceUrl,
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
    await loadApprovals();
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
    await loadApprovals();
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
        <h1>Pending Approvals</h1>
        <p>Loading submissions...</p>
      </main>
    );
  }

  return (
    <main>
      <p>
        <a href="/admin/dashboard">← Back to Admin Home</a>
      </p>

      <h1>Pending Approvals</h1>

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

            {submission.evidence_url && (
              <div>
                <p>
                  <strong>Photo Evidence:</strong>
                </p>

                <a
                  href={submission.evidence_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={submission.evidence_url}
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
