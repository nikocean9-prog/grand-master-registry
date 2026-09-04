"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../../../lib/adminAuth";
import { getEvidenceUrl } from "../../../lib/evidenceUrl";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SubmissionHistoryDetails() {
  const params = useParams();
  const submissionId = params?.id;
  const [submission, setSubmission] = useState(null);
  const [cards, setCards] = useState([]);
  const [changes, setChanges] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [replacementPhoto, setReplacementPhoto] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (submissionId) loadSubmission();
  }, [submissionId]);

  async function loadSubmission() {
    setLoading(true);
    setMessage("");

    const admin = await getCurrentAdmin(supabase);
    if (!admin) {
      await supabase.auth.signOut();
      window.location.href = "/admin";
      return;
    }
    setIsOwner(admin.isOwner);

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

    const [{ data: serial }, { data: cardData }, { data: changeData }] =
      await Promise.all([
        supabase
          .from("serials")
          .select("id, card_id, serial_number, region")
          .eq("id", data.serial_id)
          .single(),
        supabase.from("cards").select("id, name").order("id"),
        supabase
          .from("submission_change_log")
          .select("id, action, reason, changed_by_email, changed_at")
          .eq("submission_id", submissionId)
          .order("changed_at", { ascending: false }),
      ]);

    let card = null;
    if (serial) {
      card = (cardData || []).find((item) => item.id === serial.card_id) || null;
    }

    const evidenceUrl = await getEvidenceUrl(supabase, data.photo_url);
    setCards(cardData || []);
    setChanges(changeData || []);
    setSubmission({ ...data, serial, card, evidence_url: evidenceUrl });
    setEditForm({
      cardId: String(serial?.card_id || ""),
      serialNumber: String(serial?.serial_number || 1),
      region: serial?.region || "AMERICAS",
      country: data.country || "",
      sourceUrl: data.source_url || "",
      notes: data.notes || "",
      photoUrl: data.photo_url || "",
    });
    setReplacementPhoto(null);
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

  async function findSerialId() {
    const serialValue = Number(editForm.serialNumber);
    if (!Number.isInteger(serialValue) || serialValue < 1 || serialValue > 100) {
      throw new Error("Serial number must be between 1 and 100.");
    }

    const { data, error } = await supabase
      .from("serials")
      .select("id")
      .eq("card_id", Number(editForm.cardId))
      .eq("serial_number", serialValue)
      .eq("region", editForm.region)
      .single();

    if (error || !data) throw new Error("The selected serial could not be found.");
    return data.id;
  }

  async function uploadReplacementPhoto() {
    if (!replacementPhoto) return editForm.photoUrl;

    const safeName = replacementPhoto.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `submissions/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage
      .from("submission-evidence")
      .upload(filePath, replacementPhoto);

    if (error) throw new Error(`Photo upload failed: ${error.message}`);
    return filePath;
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!reason.trim()) {
      setMessage("Enter a reason for the change.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const serialId = await findSerialId();
      const photoUrl = await uploadReplacementPhoto();
      const { error } = await supabase.rpc("owner_edit_submission", {
        p_submission_id: Number(submissionId),
        p_serial_id: serialId,
        p_country: editForm.country,
        p_source_url: editForm.sourceUrl,
        p_notes: editForm.notes,
        p_photo_url: photoUrl,
        p_reason: reason,
      });
      if (error) throw error;

      setEditing(false);
      setReason("");
      setMessage("Registry record updated.");
      await loadSubmission();
    } catch (error) {
      setMessage(error.message || "The record could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!reason.trim()) {
      setMessage("Enter a reason before removing this record.");
      return;
    }
    if (!window.confirm("Remove this card from the public registry? You can restore it later.")) {
      return;
    }

    setBusy(true);
    const { error } = await supabase.rpc("owner_remove_submission", {
      p_submission_id: Number(submissionId),
      p_reason: reason,
    });
    if (error) {
      setMessage(error.message);
    } else {
      setReason("");
      setMessage("Record removed from the public registry. It can be restored.");
      await loadSubmission();
    }
    setBusy(false);
  }

  async function handleRestore() {
    if (!reason.trim()) {
      setMessage("Enter a reason before restoring this record.");
      return;
    }
    if (!window.confirm("Restore this card to the public registry?")) return;

    setBusy(true);
    const { error } = await supabase.rpc("owner_restore_submission", {
      p_submission_id: Number(submissionId),
      p_reason: reason,
    });
    if (error) {
      setMessage(error.message);
    } else {
      setReason("");
      setMessage("Record restored to the public registry.");
      await loadSubmission();
    }
    setBusy(false);
  }

  if (loading) {
    return <main><h1>Submission Details</h1><p>Loading submission...</p></main>;
  }

  if (!submission) {
    return (
      <main>
        <p><a href="/admin/history">← Back to Submission History</a></p>
        <h1>Submission Details</h1>
        <p>{message || "Submission not found."}</p>
      </main>
    );
  }

  const statusColor =
    submission.status === "approved"
      ? "#2e7d32"
      : submission.status === "removed"
      ? "#9a6700"
      : "#b71c1c";

  return (
    <main>
      <p><a href="/admin/history">← Back to Submission History</a></p>
      <h1>{submission.card?.name || "Unknown Card"}</h1>
      {message && <p>{message}</p>}

      <div style={{ border: `2px solid ${statusColor}`, padding: "20px" }}>
        <p>
          <strong>Status:</strong>{" "}
          <strong style={{ color: statusColor, textTransform: "capitalize" }}>
            {submission.status}
          </strong>
        </p>
        <p><strong>Serial:</strong> {formatSerial(submission.serial)}</p>
        <p><strong>Region:</strong> {formatRegion(submission.serial)}</p>
        <p><strong>Country:</strong> {submission.country || "Not provided"}</p>
        <p>
          <strong>Submitted:</strong>{" "}
          {submission.created_at
            ? new Date(submission.created_at).toLocaleString()
            : "Unknown"}
        </p>
        <p>
          <strong>
            {submission.status === "approved" ? "Approved by:" : "Reviewed by:"}
          </strong>{" "}
          {submission.reviewed_by_email || "Not recorded"}
        </p>
        <p>
          <strong>Reviewed:</strong>{" "}
          {submission.reviewed_at
            ? new Date(submission.reviewed_at).toLocaleString()
            : "Not recorded"}
        </p>

        {submission.notes && (
          <div><p><strong>Notes:</strong></p><p style={{ whiteSpace: "pre-wrap" }}>{submission.notes}</p></div>
        )}

        {submission.submitter_email && (
          <div style={{ marginBottom: "16px" }}>
            <p><strong>Contact email:</strong> {submission.submitter_email}</p>
            <a
              href={`mailto:${submission.submitter_email}?subject=${encodeURIComponent(
                `Grand Master Registry submission: ${submission.card?.name || "Unknown Card"} ${formatSerial(submission.serial)}`
              )}`}
              style={{ display: "inline-block", border: "1px solid #333", padding: "8px 14px", textDecoration: "none" }}
            >
              Contact submitter
            </a>
          </div>
        )}

        {submission.source_url && (
          <p><strong>Source:</strong>{" "}
            <a href={submission.source_url} target="_blank" rel="noopener noreferrer">View source</a>
          </p>
        )}

        {submission.evidence_url && (
          <div>
            <p><strong>Photo Evidence:</strong></p>
            <a href={submission.evidence_url} target="_blank" rel="noopener noreferrer">
              <img
                src={submission.evidence_url}
                alt="Submission evidence"
                style={{ display: "block", maxWidth: "500px", width: "100%", height: "auto" }}
              />
            </a>
          </div>
        )}
      </div>

      {isOwner && editForm && (
        <section style={{ border: "2px solid #333", padding: "20px", marginTop: "25px" }}>
          <h2>Main Admin Controls</h2>
          <p>Only your main-admin account can use these controls. Every action is recorded.</p>

          {editing ? (
            <form onSubmit={handleSave}>
              <label>Card<br />
                <select
                  value={editForm.cardId}
                  onChange={(e) => setEditForm({ ...editForm, cardId: e.target.value })}
                  required
                >
                  {cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}
                </select>
              </label>
              <br /><br />

              <label>Serial number<br />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={editForm.serialNumber}
                  onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
                  required
                />
              </label>
              <br /><br />

              <label>Region<br />
                <select
                  value={editForm.region}
                  onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                >
                  <option value="AMERICAS">Americas</option>
                  <option value="E">Europe-distributed</option>
                </select>
              </label>
              <br /><br />

              <label>Country<br />
                <input
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                />
              </label>
              <br /><br />

              <label>Source URL<br />
                <input
                  type="url"
                  value={editForm.sourceUrl}
                  onChange={(e) => setEditForm({ ...editForm, sourceUrl: e.target.value })}
                  style={{ width: "100%", maxWidth: "600px" }}
                />
              </label>
              <br /><br />

              <label>Notes<br />
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows="4"
                  style={{ width: "100%", maxWidth: "600px" }}
                />
              </label>
              <br /><br />

              <label>Replace photo (optional)<br />
                <input type="file" accept="image/*" onChange={(e) => setReplacementPhoto(e.target.files?.[0] || null)} />
              </label>
              <br /><br />

              <label>Reason for change (required)<br />
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows="3"
                  required
                  style={{ width: "100%", maxWidth: "600px" }}
                />
              </label>
              <br /><br />

              <button type="submit" disabled={busy}>{busy ? "Saving..." : "Save Changes"}</button>{" "}
              <button type="button" onClick={() => { setEditing(false); setReason(""); }} disabled={busy}>Cancel</button>
            </form>
          ) : (
            <>
              <button type="button" onClick={() => setEditing(true)} disabled={busy}>
                Edit Record
              </button>

              <div style={{ marginTop: "20px" }}>
                <label>Reason (required for remove or restore)<br />
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows="3"
                    style={{ width: "100%", maxWidth: "600px" }}
                  />
                </label>
              </div>

              {submission.status === "approved" && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={busy}
                  style={{ marginTop: "12px", color: "#b71c1c", borderColor: "#b71c1c" }}
                >
                  {busy ? "Processing..." : "Remove from Public Registry"}
                </button>
              )}

              {submission.status === "removed" && (
                <button type="button" onClick={handleRestore} disabled={busy} style={{ marginTop: "12px" }}>
                  {busy ? "Processing..." : "Restore to Public Registry"}
                </button>
              )}
            </>
          )}
        </section>
      )}

      {changes.length > 0 && (
        <section style={{ marginTop: "25px" }}>
          <h2>Change History</h2>
          {changes.map((change) => (
            <div key={change.id} style={{ borderTop: "1px solid #ccc", padding: "12px 0" }}>
              <strong style={{ textTransform: "capitalize" }}>{change.action}</strong>
              {" — "}
              {new Date(change.changed_at).toLocaleString()}
              <br />
              <span>{change.changed_by_email || "Unknown admin"}</span>
              <p style={{ marginBottom: 0 }}><strong>Reason:</strong> {change.reason}</p>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
