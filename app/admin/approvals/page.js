"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../../lib/adminAuth";
import { getEvidencePath } from "../../lib/evidenceUrl";
import CardCropEditor from "../../components/CardCropEditor";
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
        {value !== null &&
          typeof value !== "undefined" &&
          Number.isInteger(confidence) &&
          confidence > 0 && <small>{confidence}% confidence</small>}
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
  const [photoViewer, setPhotoViewer] = useState(null);
  const [editingSerialId, setEditingSerialId] = useState(null);
  const [correctedSerialNumber, setCorrectedSerialNumber] = useState("");
  const [correctedRegion, setCorrectedRegion] = useState("AMERICAS");
  const [cropBusyId, setCropBusyId] = useState(null);

  useEffect(() => {
    loadApprovals(page);
  }, [page]);

  useEffect(() => {
    if (!photoViewer) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setPhotoViewer(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [photoViewer]);

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

    const confirmedSerialIds = [...new Set(
      (submissionData || [])
        .filter((submission) => submission.serial?.status === "confirmed")
        .map((submission) => submission.serial_id)
    )];
    let confirmedBySerial = {};

    if (confirmedSerialIds.length > 0) {
      const { data: confirmedData, error: confirmedError } = await supabase
        .from("submissions")
        .select("*")
        .in("serial_id", confirmedSerialIds)
        .eq("status", "approved")
        .order("reviewed_at", { ascending: false });

      if (confirmedError) {
        console.error("Could not load confirmed records:", confirmedError);
      } else {
        confirmedBySerial = (confirmedData || []).reduce((records, item) => {
          if (!records[item.serial_id]) records[item.serial_id] = item;
          return records;
        }, {});
      }
    }

    const rows = (submissionData || []).map((submission) => ({
      ...submission,
      serial: submission.serial || null,
      card: submission.serial?.card || null,
      exact_duplicate_status:
        duplicateStatuses[submission.exact_duplicate_of] || null,
      existing_submission: confirmedBySerial[submission.serial_id] || null,
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
    const records = [submission, submission.existing_submission]
      .filter(Boolean)
      .filter((record) => record.photo_url && !evidenceUrls[record.id]);

    if (records.length === 0) return;

    setEvidenceLoadingId(submission.id);
    const signedResults = await Promise.all(records.map(async (record) => {
      const evidencePath = getEvidencePath(record.photo_url);
      if (!evidencePath) return { id: record.id, signedUrl: null };

      const { data, error } = await supabase.storage
        .from("submission-evidence")
        .createSignedUrl(evidencePath, 3600);

      if (error) console.error("Could not create evidence URL:", error);
      return { id: record.id, signedUrl: data?.signedUrl || null };
    }));

    const loadedUrls = Object.fromEntries(
      signedResults.filter((item) => item.signedUrl).map((item) => [item.id, item.signedUrl])
    );
    setEvidenceUrls((current) => ({ ...current, ...loadedUrls }));
    if (signedResults.some((item) => !item.signedUrl)) {
      setMessage("One of the evidence photos could not be loaded.");
    }
    setEvidenceLoadingId(null);
  }

  async function handleApprove(submission) {
    if (submission.existing_submission) {
      const confirmed = window.confirm(
        "Replace the existing confirmed record with this new submission? The earlier record will remain in Admin History."
      );
      if (!confirmed) return;
    }

    setBusyId(submission.id);
    setMessage("");

    const { error } = await supabase.rpc("approve_submission", {
      p_submission_id: submission.id,
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

  async function handleDisplayCrop(submission, displayCrop) {
    setCropBusyId(submission.id);
    setMessage("");
    const { error } = await supabase.rpc("save_submission_display_crop", {
      p_submission_id: submission.id,
      p_display_crop: displayCrop,
    });
    if (error) {
      setMessage(safeAdminActionMessage(error, "save this display crop"));
      if (isMfaRequiredError(error)) {
        window.setTimeout(() => { window.location.href = "/admin/mfa"; }, 1500);
      }
    } else {
      setSubmissions((current) => current.map((item) => item.id === submission.id
        ? { ...item, display_crop: displayCrop }
        : item));
      setMessage("Straightened display saved. The original evidence photo is unchanged.");
    }
    setCropBusyId(null);
  }

  async function handleReject(submission) {
    const confirmed = window.confirm(
      submission.existing_submission
        ? "Keep the existing confirmed record and reject this new submission?"
        : "Are you sure you want to reject this submission?"
    );

    if (!confirmed) {
      return;
    }

    setBusyId(submission.id);
    setMessage("");

    const { error } = await supabase.rpc("reject_submission", {
      p_submission_id: submission.id,
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

  async function handleSerialCorrection(submission) {
    const nextNumber = Number(correctedSerialNumber);
    if (!Number.isInteger(nextNumber) || nextNumber < 1) {
      setMessage("Enter a valid serial number.");
      return;
    }

    const nextLabel = `${String(nextNumber).padStart(3, "0")}${correctedRegion === "E" ? "E" : ""}`;
    const confirmed = window.confirm(
      `Change this pending submission from Serial ${formatSerial(submission.serial)} (${formatRegion(submission.serial)}) to ${nextLabel} (${correctedRegion === "E" ? "E-Region" : correctedRegion === "GLOBAL" ? "Global" : "Americas"})?`
    );
    if (!confirmed) return;

    setBusyId(submission.id);
    setMessage("");
    const { error } = await supabase.rpc("change_pending_submission_serial", {
      p_submission_id: submission.id,
      p_serial_number: nextNumber,
      p_region: correctedRegion,
    });

    if (error) {
      setMessage(safeAdminActionMessage(error, "change the serial number"));
      setBusyId(null);
      if (isMfaRequiredError(error)) {
        window.setTimeout(() => { window.location.href = "/admin/mfa"; }, 1500);
      }
      return;
    }

    setEditingSerialId(null);
    setCorrectedSerialNumber("");
    setCorrectedRegion("AMERICAS");
    await loadApprovals(page);
    setMessage("Serial number and region corrected.");
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
            const photoRisk = riskDisplay(submission);
            const hasConfirmedConflict = Boolean(submission.existing_submission);
            const risk = hasConfirmedConflict
              ? { label: "Medium risk", tone: "review" }
              : photoRisk;
            const isExpanded = expandedId === submission.id;
            const evidenceUrl = evidenceUrls[submission.id] || null;
            const existingEvidenceUrl = submission.existing_submission
              ? evidenceUrls[submission.existing_submission.id] || null
              : null;

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
                    {hasConfirmedConflict && (
                      <div className="approval-warning">
                        <strong>
                          Confirmed serial conflict
                        </strong>
                        <p>
                          This serial already has a confirmed record. Compare the
                          existing evidence with the new submission before deciding.
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

                    <div className="approval-serial-correction">
                      {editingSerialId === submission.id ? (
                        <>
                          <label htmlFor={`correct-serial-${submission.id}`}>
                            Correct serial number and region
                          </label>
                          <input
                            id={`correct-serial-${submission.id}`}
                            type="number"
                            min="1"
                            inputMode="numeric"
                            value={correctedSerialNumber}
                            onChange={(event) => setCorrectedSerialNumber(event.target.value)}
                          />
                          <select
                            aria-label="Correct region"
                            value={correctedRegion}
                            onChange={(event) => setCorrectedRegion(event.target.value)}
                          >
                            {submission.serial?.region === "GLOBAL" ? (
                              <option value="GLOBAL">Global</option>
                            ) : (
                              <>
                                <option value="AMERICAS">Americas</option>
                                <option value="E">E-Region</option>
                              </>
                            )}
                          </select>
                          <button type="button" onClick={() => handleSerialCorrection(submission)} disabled={busyId === submission.id}>
                            Save correction
                          </button>
                          <button type="button" onClick={() => { setEditingSerialId(null); setCorrectedSerialNumber(""); setCorrectedRegion("AMERICAS"); }} disabled={busyId === submission.id}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => { setEditingSerialId(submission.id); setCorrectedSerialNumber(String(submission.serial?.serial_number || "")); setCorrectedRegion(submission.serial?.region || "AMERICAS"); }}>
                          Change serial / region
                        </button>
                      )}
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

                    {hasConfirmedConflict ? (
                      <div className="approval-comparison-grid">
                        <section className="approval-comparison-card">
                          <div className="approval-comparison-heading">
                            <h3>Existing confirmed record</h3>
                            <span>Confirmed</span>
                          </div>
                          {evidenceLoadingId === submission.id && !existingEvidenceUrl && <p>Loading photo...</p>}
                          {existingEvidenceUrl && (
                            <button type="button" className="approval-photo-button" onClick={() => setPhotoViewer({ url: existingEvidenceUrl, alt: "Existing confirmed evidence" })}>
                              <img src={existingEvidenceUrl} alt="Existing confirmed evidence" loading="lazy" />
                              <small>Tap photo to enlarge</small>
                            </button>
                          )}
                          <dl>
                            <div><dt>Confirmed</dt><dd>{submission.existing_submission.reviewed_at ? new Date(submission.existing_submission.reviewed_at).toLocaleString() : "Unknown"}</dd></div>
                            <div><dt>Country</dt><dd>{submission.existing_submission.country || "Not provided"}</dd></div>
                            <div><dt>Source</dt><dd>{submission.existing_submission.source_url ? <a href={submission.existing_submission.source_url} target="_blank" rel="noopener noreferrer">View source</a> : "Not provided"}</dd></div>
                            <div><dt>Notes</dt><dd>{submission.existing_submission.notes || "None"}</dd></div>
                          </dl>
                        </section>

                        <section className="approval-comparison-card">
                          <div className="approval-comparison-heading">
                            <h3>New submission</h3>
                            <span>Pending</span>
                          </div>
                          {evidenceLoadingId === submission.id && !evidenceUrl && <p>Loading photo...</p>}
                          {evidenceUrl && (
                            <button type="button" className="approval-photo-button" onClick={() => setPhotoViewer({ url: evidenceUrl, alt: "New submission evidence" })}>
                              <img src={evidenceUrl} alt="New submission evidence" loading="lazy" />
                              <small>Tap photo to enlarge</small>
                            </button>
                          )}
                          <dl>
                            <div><dt>Submitted</dt><dd>{submission.created_at ? new Date(submission.created_at).toLocaleString() : "Unknown"}</dd></div>
                            <div><dt>Country</dt><dd>{submission.country || "Not provided"}</dd></div>
                            <div><dt>Source</dt><dd>{submission.source_url ? <a href={submission.source_url} target="_blank" rel="noopener noreferrer">View source</a> : "Not provided"}</dd></div>
                            <div><dt>Photo check</dt><dd>{photoRisk.label}</dd></div>
                          </dl>
                        </section>
                      </div>
                    ) : (
                    <div className="approval-review-grid">
                      <div className="approval-evidence">
                        <h3>Photo evidence</h3>
                        {evidenceLoadingId === submission.id && <p>Loading photo...</p>}
                        {!evidenceLoadingId && evidenceUrl && (
                          <button type="button" className="approval-photo-button" onClick={() => setPhotoViewer({ url: evidenceUrl, alt: "Submission evidence" })}>
                            <img src={evidenceUrl} alt="Submission evidence" loading="lazy" />
                            <small>Tap photo to enlarge</small>
                          </button>
                        )}
                      </div>

                      <section className={`approval-report photo-check-${photoRisk.tone}`}>
                        <div className="photo-check-heading">
                          <h3>Submission check</h3>
                          <span className="photo-check-badge">{photoRisk.label}</span>
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
                    )}

                    {hasConfirmedConflict && (
                      <section className={`approval-report approval-conflict-report photo-check-${photoRisk.tone}`}>
                        <div className="photo-check-heading">
                          <h3>New submission check</h3>
                          <span className="photo-check-badge">{photoRisk.label}</span>
                        </div>
                        <dl className="approval-check-list">
                          <CheckRow label="Card name" expected={submission.card?.name || "Unknown"} observed={submission.ai_card_name_read || "Unable to determine"} value={submission.ai_name_match} confidence={submission.ai_name_confidence} />
                          <CheckRow label="Serial number" expected={formatSerial(submission.serial)} observed={submission.ai_serial_read || "Unable to determine"} value={submission.ai_serial_match} confidence={submission.ai_serial_confidence} />
                          <CheckRow label="Reference thumbnail" value={submission.ai_thumbnail_match} confidence={submission.ai_thumbnail_confidence} />
                          <CheckRow label="Visible editing indicators" value={submission.ai_possible_edit} confidence={submission.ai_edit_confidence} positiveWhenTrue={false} />
                        </dl>
                        <p className="photo-check-disclaimer">Photo assessment only. The confirmed-record conflict sets the overall submission to Medium risk.</p>
                      </section>
                    )}

                    {evidenceUrl && (
                      <CardCropEditor
                        key={`${submission.id}-${JSON.stringify(submission.display_crop || null)}`}
                        src={evidenceUrl}
                        value={submission.display_crop}
                        busy={cropBusyId === submission.id}
                        onSave={(displayCrop) => handleDisplayCrop(submission, displayCrop)}
                      />
                    )}

                    <div className="approval-actions">
                      <button
                        type="button"
                        onClick={() => handleApprove(submission)}
                        disabled={busyId === submission.id}
                      >
                        {busyId === submission.id
                          ? "Processing..."
                          : hasConfirmedConflict ? "Replace confirmed record" : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(submission)}
                        disabled={busyId === submission.id}
                      >
                        {hasConfirmedConflict ? "Keep existing record" : "Reject"}
                      </button>
                      {hasConfirmedConflict && (
                        <button type="button" onClick={() => setExpandedId(null)} disabled={busyId === submission.id}>
                          Leave pending
                        </button>
                      )}
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

      {photoViewer && (
        <div className="approval-photo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPhotoViewer(null); }}>
          <div className="approval-photo-modal" role="dialog" aria-modal="true" aria-label="Evidence photo">
            <button type="button" className="approval-photo-modal-close" onClick={() => setPhotoViewer(null)} aria-label="Close photo viewer">×</button>
            <img src={photoViewer.url} alt={photoViewer.alt} />
          </div>
        </div>
      )}
    </main>
  );
}
