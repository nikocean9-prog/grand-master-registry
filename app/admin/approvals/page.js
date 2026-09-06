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

function checkTone(value, positiveWhenTrue = true) {
  if (value === null || typeof value === "undefined") return "review";
  const isPositive = positiveWhenTrue ? value === true : value === false;
  return isPositive ? "low" : "high";
}

function CheckRow({
  label,
  expected,
  observed,
  value,
  confidence,
  positiveWhenTrue = true,
  toneOverride,
  resultOverride,
}) {
  const tone = toneOverride || checkTone(value, positiveWhenTrue);
  const result = resultOverride || (value === null || typeof value === "undefined"
    ? "Unable to determine"
    : positiveWhenTrue
      ? value ? "Match" : "Mismatch"
      : value ? "Flagged" : "Not detected");

  return (
    <div className={`approval-check-row approval-check-${tone}`}>
      <span className="approval-check-icon" aria-hidden="true">
        {tone === "low" ? "✓" : tone === "high" ? "×" : "!"}
      </span>
      <div className="approval-check-copy">
        <dt>{label}</dt>
        {expected && <span><b>Expected:</b> {expected}</span>}
        {observed && <span><b>Photo reads:</b> {observed}</span>}
      </div>
      <dd>
        <strong>{result}</strong>
        {Number.isInteger(confidence) && <small>{confidence}% confidence</small>}
      </dd>
    </div>
  );
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

    const duplicateIds = [...new Set(
      (submissionData || [])
        .map((submission) => submission.exact_duplicate_of)
        .filter(Boolean)
    )];
    let duplicateStatuses = {};
    if (duplicateIds.length > 0) {
      const { data: duplicateData } = await supabase
        .from("submissions")
        .select("id, status")
        .in("id", duplicateIds);
      duplicateStatuses = Object.fromEntries(
        (duplicateData || []).map((item) => [item.id, item.status])
      );
    }

    const rows = (submissionData || []).map((submission) => ({
      ...submission,
      serial: submission.serial || null,
      card: submission.serial?.card || null,
      exact_duplicate_status:
        duplicateStatuses[submission.exact_duplicate_of] || null,
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
                      <span className={`approval-duplicate approval-duplicate-${
                        submission.exact_duplicate_status === "approved" ? "high" : "review"
                      }`}>Duplicate</span>
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

                    <div className="approval-review-grid">
                      <div className="approval-evidence">
                        <h3>Photo evidence</h3>
                        {evidenceLoadingId === submission.id && <p>Loading photo...</p>}
                        {!evidenceLoadingId && evidenceUrl && (
                          <a href={evidenceUrl} target="_blank" rel="noopener noreferrer">
                            <img src={evidenceUrl} alt="Submission evidence" loading="lazy" />
                          </a>
                        )}
                      </div>

                      <section className={`approval-report photo-check-${risk.tone}`}>
                        <div className="photo-check-heading">
                          <h3>Submission check</h3>
                          <span className="photo-check-badge">{risk.label}</span>
                        </div>
                        <dl className="approval-check-list">
                          <CheckRow
                            label="Card name"
                            expected={submission.card?.name || "Unknown"}
                            observed={submission.ai_card_name_read || "Unable to determine"}
                            value={submission.ai_name_match}
                            confidence={submission.ai_name_confidence}
                          />
                          <CheckRow
                            label="Serial number"
                            expected={formatSerial(submission.serial)}
                            observed={submission.ai_serial_read || "Unable to determine"}
                            value={submission.ai_serial_match}
                            confidence={submission.ai_serial_confidence}
                          />
                          <CheckRow
                            label="Reference thumbnail"
                            value={submission.ai_thumbnail_match}
                            confidence={submission.ai_thumbnail_confidence}
                          />
                          <CheckRow
                            label="Visible editing indicators"
                            value={submission.ai_possible_edit}
                            confidence={submission.ai_edit_confidence}
                            positiveWhenTrue={false}
                          />
                          {submission.exact_duplicate_of && (
                            <CheckRow
                              label={`Previously submitted (#${submission.exact_duplicate_of})`}
                              expected={submission.exact_duplicate_status
                                ? `Earlier submission: ${submission.exact_duplicate_status}`
                                : "Earlier submission status unavailable"}
                              toneOverride={submission.exact_duplicate_status === "approved"
                                ? "high"
                                : "review"}
                              resultOverride={submission.exact_duplicate_status === "approved"
                                ? "Approved duplicate"
                                : "Review only"}
                            />
                          )}
                        </dl>
                        {Array.isArray(submission.ai_edit_indicators) &&
                          submission.ai_edit_indicators.length > 0 && (
                            <p className="approval-edit-note">
                              <strong>Editing indicators:</strong>{" "}
                              {submission.ai_edit_indicators.join(", ")}
                            </p>
                          )}
                        <p className="photo-check-disclaimer">
                          Advisory check only. Review the original photo before deciding.
                        </p>
                      </section>
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
