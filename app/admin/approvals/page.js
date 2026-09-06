"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../../lib/adminAuth";
import { getEvidencePath } from "../../lib/evidenceUrl";
import {
  isMfaRequiredError,
  safeAdminActionMessage,
} from "../../lib/userMessages";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function riskDisplay(submission) {
  if (submission.ai_check_status === "pending") {
    return { label: "Checking photo…", tone: "pending" };
  }
  if (submission.ai_check_status === "screened") {
    return { label: "Detailed check running…", tone: "pending" };
  }
  if (submission.ai_check_status === "manual") {
    return { label: "Medium risk", tone: "review" };
  }
  if (submission.ai_check_status === "not_analyzed") {
    return { label: "Not analysed", tone: "unavailable" };
  }
  if (
    submission.ai_check_status === "unavailable" ||
    submission.ai_check_status === "error" ||
    submission.ai_risk_level === "unavailable"
  ) {
    return { label: "Check unavailable", tone: "unavailable" };
  }
  if (submission.ai_risk_level === "high") {
    return { label: "High risk", tone: "high" };
  }
  if (submission.ai_risk_level === "review") {
    return { label: "Medium risk", tone: "review" };
  }
  if (submission.ai_risk_level === "low") {
    return { label: "Low risk", tone: "low" };
  }
  return { label: "Not analysed", tone: "unavailable" };
}

function checkValue(value, trueLabel, falseLabel) {
  if (value === true) return trueLabel;
  if (value === false) return falseLabel;
  return "Unable to determine";
}

function checkWithConfidence(value, trueLabel, falseLabel, confidence) {
  const result = checkValue(value, trueLabel, falseLabel);
  return Number.isInteger(confidence)
    ? `${result} — ${confidence}% confidence in this assessment`
    : result;
}

export default function AdminApprovals() {
  const PAGE_SIZE = 25;
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [evidenceUrls, setEvidenceUrls] = useState({});
  const [evidenceLoadingId, setEvidenceLoadingId] = useState(null);

  useEffect(() => {
    loadApprovals(page);
  }, [page]);

  async function loadApprovals(pageNumber = page) {
    setLoading(true);
    setMessage("");
    setExpandedId(null);

    const admin = await getCurrentAdmin(supabase);

    if (!admin) {
      await supabase.auth.signOut();
      window.location.href = "/admin?reason=session";
      return;
    }

    const from = pageNumber * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const {
      data: submissionData,
      error: submissionError,
      count,
    } = await supabase
      .from("submissions")
      .select(
        `
          *,
          serial:serials (
            id,
            card_id,
            serial_number,
            region,
            status,
            card:cards (
              id,
              name
            )
          )
        `,
        { count: "exact" }
      )
      .eq("status", "pending")
      .neq("ai_check_status", "pending")
      .order("created_at", { ascending: true })
      .range(from, to);

    if (submissionError) {
      console.error("Could not load submissions:", submissionError);
      setMessage("Could not load submissions.");
      setLoading(false);
      return;
    }

    const rows = (submissionData || []).map((submission) => ({
      ...submission,
      serial: submission.serial || null,
      card: submission.serial?.card || null,
    }));

    if (rows.length === 0 && pageNumber > 0) {
      setPage(pageNumber - 1);
      return;
    }

    setSubmissions(rows);
    setTotalCount(count || 0);
    setLoading(false);
  }

  async function toggleSubmission(submission) {
    if (expandedId === submission.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(submission.id);
    if (evidenceUrls[submission.id] || !submission.photo_url) return;

    const evidencePath = getEvidencePath(submission.photo_url);
    if (!evidencePath) return;

    setEvidenceLoadingId(submission.id);
    const { data, error } = await supabase.storage
      .from("submission-evidence")
      .createSignedUrl(evidencePath, 3600);

    if (error) {
      console.error("Could not create evidence URL:", error);
      setMessage("The evidence photo could not be loaded.");
    } else if (data?.signedUrl) {
      setEvidenceUrls((current) => ({
        ...current,
        [submission.id]: data.signedUrl,
      }));
    }
    setEvidenceLoadingId(null);
  }

  async function handleApprove(submissionId) {
    setBusyId(submissionId);
    setMessage("");

    const { error } = await supabase.rpc("approve_submission", {
      p_submission_id: submissionId,
    });

    if (error) {
      setMessage(safeAdminActionMessage(error, "approve this submission"));
      setBusyId(null);
      if (isMfaRequiredError(error)) {
        window.setTimeout(() => {
          window.location.href = "/admin/mfa";
        }, 1500);
      }
      return;
    }

    await loadApprovals(page);
    setMessage("Submission approved.");
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
      setMessage(safeAdminActionMessage(error, "reject this submission"));
      setBusyId(null);
      if (isMfaRequiredError(error)) {
        window.setTimeout(() => {
          window.location.href = "/admin/mfa";
        }, 1500);
      }
      return;
    }

    await loadApprovals(page);
    setMessage("Submission rejected.");
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


  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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

      <div className="admin-section-heading">
        <div>
          <h2>Pending Submissions</h2>
          <p className="approval-count">
            {totalCount} pending · Page {page + 1} of {totalPages}
          </p>
        </div>
        <button type="button" onClick={() => loadApprovals(page)}>
          Refresh checks
        </button>
      </div>

      {message && <p>{message}</p>}

      {submissions.length === 0 ? (
        <p>No pending submissions.</p>
      ) : (
        <div className="approval-list">
          {submissions.map((submission) => {
            const risk = riskDisplay(submission);
            const isExpanded = expandedId === submission.id;
            const evidenceUrl = evidenceUrls[submission.id] || null;

            return (
              <article
                key={submission.id}
                className={`approval-row approval-row-${risk.tone} ${
                  isExpanded ? "is-expanded" : ""
                }`}
              >
                <button
                  type="button"
                  className="approval-summary"
                  onClick={() => toggleSubmission(submission)}
                  aria-expanded={isExpanded}
                >
                  <span className="approval-summary-main">
                    <strong>{submission.card?.name || "Unknown Card"}</strong>
                    <span>
                      Serial {formatSerial(submission.serial)} ·{" "}
                      {formatRegion(submission.serial)}
                    </span>
                  </span>
                  <span className="approval-summary-meta">
                    {submission.exact_duplicate_of && (
                      <span className="approval-duplicate">Duplicate</span>
                    )}
                    <span className={`photo-check-badge approval-risk-${risk.tone}`}>
                      {risk.label}
                    </span>
                    <span aria-hidden="true">{isExpanded ? "▲" : "▼"}</span>
                  </span>
                </button>

                {isExpanded && (
                  <div className="approval-details">
                    {submission.serial?.status === "confirmed" && (
                      <div className="approval-warning">
                        <strong>
                          Warning: This serial has already been confirmed.
                        </strong>
                        <p>
                          Approving this submission may replace the existing
                          public record. Check the current evidence first.
                        </p>
                      </div>
                    )}

                    <section className={`photo-check photo-check-${risk.tone}`}>
                      <div className="photo-check-heading">
                        <h3>Automated Photo Check</h3>
                        <span className="photo-check-badge">{risk.label}</span>
                      </div>

                      {submission.ai_summary && <p>{submission.ai_summary}</p>}

                      {Array.isArray(submission.ai_reasons) &&
                        submission.ai_reasons.length > 0 && (
                          <ul>
                            {submission.ai_reasons.map((reason, index) => (
                              <li key={`${submission.id}-reason-${index}`}>
                                {reason}
                              </li>
                            ))}
                          </ul>
                        )}

                      {submission.ai_check_status === "complete" && (
                        <>
                          <dl className="photo-check-details">
                            <div>
                              <dt>Card name read</dt>
                              <dd>
                                {submission.ai_card_name_read ||
                                  "Unable to determine"}
                              </dd>
                            </div>
                            <div>
                              <dt>Card name match</dt>
                              <dd>
                                {checkWithConfidence(
                                  submission.ai_name_match,
                                  "Matches",
                                  "Mismatch",
                                  submission.ai_name_confidence
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt>Serial read</dt>
                              <dd>
                                {submission.ai_serial_read ||
                                  "Unable to determine"}
                              </dd>
                            </div>
                            <div>
                              <dt>Serial match</dt>
                              <dd>
                                {checkWithConfidence(
                                  submission.ai_serial_match,
                                  "Matches",
                                  "Mismatch",
                                  submission.ai_serial_confidence
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt>Reference thumbnail match</dt>
                              <dd>
                                {checkWithConfidence(
                                  submission.ai_thumbnail_match,
                                  "Matches",
                                  "Mismatch",
                                  submission.ai_thumbnail_confidence
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt>Overall card identity</dt>
                              <dd>
                                {checkValue(
                                  submission.ai_card_match,
                                  "Matches",
                                  "Mismatch"
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt>Visible editing indicators</dt>
                              <dd>
                                {checkWithConfidence(
                                  submission.ai_possible_edit,
                                  "Flagged",
                                  "Not detected",
                                  submission.ai_edit_confidence
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt>Confidence in the overall assessment</dt>
                              <dd>
                                {Number.isInteger(submission.ai_confidence)
                                  ? `${submission.ai_confidence}%`
                                  : "Not available"}
                              </dd>
                            </div>
                          </dl>

                          {Array.isArray(submission.ai_edit_indicators) &&
                            submission.ai_edit_indicators.length > 0 && (
                              <div>
                                <strong>Editing indicators reported:</strong>
                                <ul>
                                  {submission.ai_edit_indicators.map(
                                    (indicator, index) => (
                                      <li
                                        key={`${submission.id}-edit-${index}`}
                                      >
                                        {indicator}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}
                        </>
                      )}

                      {submission.exact_duplicate_of && (
                        <p>
                          <strong>Exact duplicate:</strong> Matches submission #
                          {submission.exact_duplicate_of}.
                        </p>
                      )}

                      <p className="photo-check-disclaimer">
                        This is an advisory visual comparison, not proof of
                        authenticity or image manipulation. Automated checks can
                        be wrong; review the original evidence before deciding.
                      </p>
                    </section>

                    <div className="approval-information">
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
                    </div>

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
                      <p>
                        <strong>Contact:</strong>{" "}
                        <a
                          href={`mailto:${submission.submitter_email}?subject=${encodeURIComponent(
                            `TCG Serial Tracker submission: ${
                              submission.card?.name || "Unknown Card"
                            } ${formatSerial(submission.serial)}`
                          )}`}
                        >
                          {submission.submitter_email}
                        </a>
                      </p>
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

                    <div className="approval-evidence">
                      <p>
                        <strong>Photo Evidence:</strong>
                      </p>
                      {evidenceLoadingId === submission.id && (
                        <p>Loading photo...</p>
                      )}
                      {!evidenceLoadingId && evidenceUrl && (
                        <a
                          href={evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={evidenceUrl}
                            alt="Submission evidence"
                            loading="lazy"
                          />
                        </a>
                      )}
                    </div>

                    <div className="approval-actions">
                      <button
                        type="button"
                        onClick={() => handleApprove(submission.id)}
                        disabled={busyId === submission.id}
                      >
                        {busyId === submission.id
                          ? "Processing..."
                          : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(submission.id)}
                        disabled={busyId === submission.id}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="approval-pagination" aria-label="Pending submissions pages">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Previous
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}
