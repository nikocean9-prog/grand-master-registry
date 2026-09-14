"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../../lib/adminAuth";
import {
  isMfaRequiredError,
  safeAdminActionMessage,
} from "../../lib/userMessages";
import BulkCropEditor from "../../components/BulkCropEditor";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MAX_FILES = 50;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const COLLAPSED_BATCHES_KEY = "bulk-upload-collapsed-batches";
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function statusLabel(status) {
  return {
    uploading: "Uploading",
    queued: "Waiting",
    processing: "Assessing",
    ready: "Sent to approvals",
    needs_review: "Needs identification",
    error: "Needs attention",
    completed: "Complete",
    completed_with_issues: "Complete · check items",
  }[status] || status;
}

export default function BulkUploadPage() {
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [batches, setBatches] = useState([]);
  const [collapsedBatchIds, setCollapsedBatchIds] = useState(() => new Set());
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [message, setMessage] = useState("");
  const [openItem, setOpenItem] = useState(null);
  const [openPhotoUrl, setOpenPhotoUrl] = useState("");
  const [openingPhoto, setOpeningPhoto] = useState(false);
  const [cards, setCards] = useState([]);
  const [manualCardId, setManualCardId] = useState("");
  const [manualSerial, setManualSerial] = useState("");
  const [manualRegion, setManualRegion] = useState("AMERICAS");
  const [savingAction, setSavingAction] = useState("");
  const [cropSaving, setCropSaving] = useState(false);
  const [cropError, setCropError] = useState("");
  const cropSaveQueue = useRef(Promise.resolve());
  const cropSaveCount = useRef(0);

  useEffect(() => {
    try {
      const savedIds = JSON.parse(window.localStorage.getItem(COLLAPSED_BATCHES_KEY) || "[]");
      if (Array.isArray(savedIds)) setCollapsedBatchIds(new Set(savedIds));
    } catch {
      window.localStorage.removeItem(COLLAPSED_BATCHES_KEY);
    }
  }, []);

  function toggleBatch(batchId) {
    setCollapsedBatchIds((current) => {
      const next = new Set(current);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      window.localStorage.setItem(COLLAPSED_BATCHES_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  const loadBatches = useCallback(async () => {
    const { data, error } = await supabase
      .from("bulk_upload_batches")
      .select(`
        id, status, total_items, processed_items, ready_items, review_items,
        created_at, updated_at,
        items:bulk_upload_items (
          id, storage_path, original_filename, status, confidence, detected_card_id, detected_serial_number,
          detected_region, error_message, submission_id, display_crop,
          card:cards ( name )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return;

    const submissionIds = [...new Set(
      (data || []).flatMap((batch) => batch.items || []).map((item) => item.submission_id).filter(Boolean)
    )];
    let submissionStatuses = {};
    if (submissionIds.length > 0) {
      const { data: submissionData } = await supabase
        .from("submissions")
        .select("id,status")
        .in("id", submissionIds);
      submissionStatuses = Object.fromEntries(
        (submissionData || []).map((submission) => [submission.id, submission.status])
      );
    }

    setBatches((data || []).map((batch) => ({
      ...batch,
      items: (batch.items || []).map((item) => ({
        ...item,
        submission_status: item.submission_id ? submissionStatuses[item.submission_id] || "pending" : null,
      })),
    })));
  }, []);

  useEffect(() => {
    if (!openItem) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeItem();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [openItem]);

  async function viewItem(item) {
    setOpenItem(item);
    setOpenPhotoUrl("");
    setOpeningPhoto(true);
    setCropSaving(false);
    setCropError("");
    setManualCardId(item.detected_card_id ? String(item.detected_card_id) : "");
    setManualSerial(item.detected_serial_number ? String(item.detected_serial_number) : "");
    setManualRegion(item.detected_region || "AMERICAS");
    const { data, error } = await supabase.storage
      .from("bulk-submission-evidence")
      .createSignedUrl(item.storage_path, 3600);
    if (error || !data?.signedUrl) {
      setMessage("The original bulk-upload photo could not be opened.");
    } else {
      setOpenPhotoUrl(data.signedUrl);
    }
    setOpeningPhoto(false);
  }

  function closeItem() {
    setOpenItem(null);
    setOpenPhotoUrl("");
    setOpeningPhoto(false);
    setCropSaving(false);
    setCropError("");
  }

  async function saveDisplayCrop(displayCrop) {
    if (!openItem) return;
    const itemId = openItem.id;
    cropSaveCount.current += 1;
    setCropSaving(true);
    setCropError("");
    setOpenItem((current) => current?.id === itemId ? { ...current, display_crop: displayCrop } : current);
    setBatches((current) => current.map((batch) => ({
      ...batch,
      items: (batch.items || []).map((item) => item.id === itemId ? { ...item, display_crop: displayCrop } : item),
    })));
    cropSaveQueue.current = cropSaveQueue.current.then(async () => {
      const { data, error } = await supabase.functions.invoke("save-bulk-display-crop", {
        body: { item_id: itemId, display_crop: displayCrop },
      });
      if (error || data?.error) setCropError(data?.error || "The crop could not be saved. Please try again.");
      else setCropError("");
      cropSaveCount.current -= 1;
      if (cropSaveCount.current === 0) setCropSaving(false);
    });
    await cropSaveQueue.current;
  }

  async function saveIdentification(approveNow = false) {
    const cardId = Number(manualCardId);
    const serialNumber = Number(manualSerial);
    if (!Number.isInteger(cardId) || !Number.isInteger(serialNumber) || serialNumber < 1) {
      setMessage("Choose the card and enter a valid serial number.");
      return;
    }

    const selectedCard = cards.find((card) => card.id === cardId);
    const serialLabel = `${String(serialNumber).padStart(3, "0")}${manualRegion === "E" ? "E" : ""}`;
    if (approveNow) {
      const { data: serial } = await supabase
        .from("serials")
        .select("id,status")
        .eq("card_id", cardId)
        .eq("serial_number", serialNumber)
        .eq("region", manualRegion)
        .maybeSingle();

      if (serial?.status === "confirmed") {
        const replace = window.confirm(
          `${selectedCard?.name || "This card"} ${serialLabel} is already confirmed. Approve this photo as the replacement record?`
        );
        if (!replace) return;
      } else {
        const confirmed = window.confirm(
          `Approve and publish ${selectedCard?.name || "this card"} ${serialLabel}?`
        );
        if (!confirmed) return;
      }
    }

    setSavingAction(approveNow ? "approve" : "pending");
    setMessage("");
    const { data, error } = await supabase.functions.invoke("process-bulk-pulls", {
      body: { action: "manual_identify", item_id: openItem.id, card_id: cardId, serial_number: serialNumber, region: manualRegion },
    });
    if (error || data?.error) {
      setMessage(data?.error || "This bulk card could not be saved.");
      setSavingAction("");
      return;
    }

    if (openItem.display_crop) {
      const { data: cropData, error: cropSyncError } = await supabase.functions.invoke("save-bulk-display-crop", {
        body: { item_id: openItem.id, display_crop: openItem.display_crop },
      });
      if (cropSyncError || cropData?.error) {
        setMessage(cropData?.error || "The card was identified, but its display crop could not be attached. Please try again.");
        setSavingAction("");
        await loadBatches();
        return;
      }
    }

    if (approveNow) {
      const { error: approvalError } = await supabase.rpc("approve_submission", {
        p_submission_id: data.submission_id,
      });
      if (approvalError) {
        setMessage(
          `${safeAdminActionMessage(approvalError, "approve this card")} It has been kept in Pending Approvals.`
        );
        setSavingAction("");
        if (isMfaRequiredError(approvalError)) {
          window.setTimeout(() => { window.location.href = "/admin/mfa"; }, 1500);
        }
        await loadBatches();
        return;
      }
    }

    closeItem();
    await loadBatches();
    setMessage(approveNow
      ? `${selectedCard?.name || "The card"} ${serialLabel} was approved and published.`
      : "The identified card was sent to Pending Approvals.");
    setSavingAction("");
  }

  async function rejectItem() {
    if (!window.confirm("Reject this bulk-upload item and remove it from the list?")) return;
    setSavingAction("reject");
    setMessage("");
    const { data, error } = await supabase.functions.invoke("process-bulk-pulls", {
      body: { action: "dismiss_item", item_id: openItem.id },
    });
    if (error || data?.error) {
      setMessage(data?.error || "This item could not be rejected.");
      setSavingAction("");
      return;
    }
    closeItem();
    await loadBatches();
    setMessage("The unsuitable item was removed from the bulk review list.");
    setSavingAction("");
  }

  useEffect(() => {
    async function initialise() {
      const { data: assurance } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") {
        window.location.href = "/admin/mfa";
        return;
      }

      const admin = await getCurrentAdmin(supabase);
      if (!admin?.isOwner) {
        window.location.href = "/admin/dashboard";
        return;
      }

      await loadBatches();
      const { data: cardData } = await supabase
        .from("cards")
        .select("id,name,set_id,serial_total,set:card_sets(name,tcg_slug,serial_scheme)")
        .order("name");
      setCards(cardData || []);
      setLoading(false);
    }
    initialise();
  }, [loadBatches]);

  useEffect(() => {
    if (loading) return undefined;
    const hasWork = batches.some((batch) =>
      ["uploading", "queued", "processing"].includes(batch.status)
    );
    if (!hasWork) return undefined;
    const timer = window.setInterval(loadBatches, 10000);
    return () => window.clearInterval(timer);
  }, [batches, loading, loadBatches]);

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files]
  );

  function chooseFiles(event) {
    const selected = Array.from(event.target.files || []);
    setMessage("");

    if (selected.length > MAX_FILES) {
      setFiles([]);
      setMessage(`Choose no more than ${MAX_FILES} photos in one batch.`);
      return;
    }

    const invalid = selected.find(
      (file) => !ACCEPTED_TYPES.has(file.type) || file.size === 0 || file.size > MAX_FILE_SIZE
    );
    if (invalid) {
      setFiles([]);
      setMessage(`${invalid.name} must be a JPG, PNG, WebP or HEIC image under 10 MB.`);
      return;
    }

    setFiles(selected);
  }

  async function uploadBatch() {
    if (!files.length || uploading) return;
    setUploading(true);
    setMessage("");
    setProgress({ done: 0, total: files.length });

    const admin = await getCurrentAdmin(supabase);
    if (!admin?.isOwner) {
      setMessage("Your owner session has expired. Please sign in again.");
      setUploading(false);
      return;
    }

    const { data: batch, error: batchError } = await supabase
      .from("bulk_upload_batches")
      .insert({ uploaded_by: admin.id, status: "uploading", total_items: files.length })
      .select("id")
      .single();

    if (batchError || !batch) {
      setMessage("The bulk upload could not be started. Please try again.");
      setUploading(false);
      return;
    }

    let uploaded = 0;
    let failed = 0;

    for (const file of files) {
      const extension = (file.name.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 8) || "jpg";
      const itemId = crypto.randomUUID();
      const storagePath = `${admin.id}/${batch.id}/${itemId}.${extension}`;

      const { error: storageError } = await supabase.storage
        .from("bulk-submission-evidence")
        .upload(storagePath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (storageError) {
        failed += 1;
      } else {
        const { error: itemError } = await supabase.from("bulk_upload_items").insert({
          id: itemId,
          batch_id: batch.id,
          storage_path: storagePath,
          original_filename: file.name.slice(0, 240),
          mime_type: file.type,
          size_bytes: file.size,
          status: "queued",
        });
        if (itemError) failed += 1;
        else uploaded += 1;
      }

      setProgress({ done: uploaded + failed, total: files.length });
    }

    await supabase
      .from("bulk_upload_batches")
      .update({
        status: uploaded ? "queued" : "completed_with_issues",
        total_items: uploaded,
        review_items: failed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", batch.id);

    setFiles([]);
    setUploading(false);
    setMessage(
      failed
        ? `${uploaded} photos queued. ${failed} could not be uploaded.`
        : `${uploaded} photos queued. Assessment will continue in the background.`
    );
    await loadBatches();
  }

  if (loading) {
    return <main><h1>Bulk Upload</h1><p>Loading…</p></main>;
  }

  return (
    <main className="bulk-upload-page">
      <p><a href="/admin/dashboard">← Back to Admin Home</a></p>

      <header className="bulk-upload-header">
        <div>
          <p className="eyebrow">Owner tools</p>
          <h1>Bulk Upload</h1>
          <p>Upload card photos once. Review, correct and publish each card here without repeating the work in Pending Approvals.</p>
        </div>
        <a className="secondary-button" href="/admin/approvals">Open Pending Approvals</a>
      </header>

      <section className="bulk-upload-panel">
        <label className="bulk-dropzone">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            onChange={chooseFiles}
            disabled={uploading}
          />
          <strong>{files.length ? `${files.length} photos selected` : "Choose card photos"}</strong>
          <span>Up to {MAX_FILES} images · 10 MB each</span>
        </label>

        {files.length > 0 && (
          <div className="bulk-upload-selection">
            <div>
              <strong>{files.length} files</strong>
              <span>{(totalSize / 1024 / 1024).toFixed(1)} MB total</span>
            </div>
            <button type="button" onClick={uploadBatch} disabled={uploading}>
              {uploading
                ? `Uploading ${progress.done} of ${progress.total}`
                : "Upload and assess"}
            </button>
          </div>
        )}

        {message && <p className="bulk-message" role="status">{message}</p>}
      </section>

      <section className="bulk-batches">
        <div className="admin-section-heading">
          <div>
            <h2>Recent batches</h2>
            <p>Processing continues even if you leave this page.</p>
          </div>
          <button type="button" onClick={loadBatches}>Refresh</button>
        </div>

        {batches.length === 0 ? (
          <p>No bulk uploads yet.</p>
        ) : batches.map((batch) => {
          const isCollapsed = collapsedBatchIds.has(batch.id);
          const contentId = `bulk-batch-content-${batch.id}`;
          return (
            <article className={`bulk-batch${isCollapsed ? " bulk-batch-collapsed" : ""}`} key={batch.id}>
              <div className="bulk-batch-summary">
                <div>
                  <strong>{new Date(batch.created_at).toLocaleString()}</strong>
                  <span>{batch.processed_items} of {batch.total_items} assessed</span>
                </div>
                <span className="bulk-batch-summary-actions">
                  <span className={`bulk-status bulk-status-${batch.status}`}>
                    {statusLabel(batch.status)}
                  </span>
                  <button
                    type="button"
                    className="bulk-batch-toggle"
                    aria-expanded={!isCollapsed}
                    aria-controls={contentId}
                    onClick={() => toggleBatch(batch.id)}
                  >
                    <span aria-hidden="true">{isCollapsed ? "+" : "−"}</span>
                    {isCollapsed ? "Expand" : "Minimize"}
                  </button>
                </span>
              </div>

              <div id={contentId} className="bulk-batch-content" hidden={isCollapsed}>
                <div className="bulk-progress" aria-label={`${batch.processed_items} of ${batch.total_items} assessed`}>
                  <span style={{ width: `${batch.total_items ? (batch.processed_items / batch.total_items) * 100 : 0}%` }} />
                </div>

                <div className="bulk-batch-counts">
                  <span><strong>{batch.ready_items}</strong> in approvals</span>
                  <span><strong>{batch.review_items}</strong> need attention</span>
                </div>

                {batch.items?.length > 0 && (
                  <div className="bulk-item-list">
                    {batch.items.filter((item) => item.status !== "dismissed").map((item) => {
                      const number = item.detected_serial_number
                        ? `${String(item.detected_serial_number).padStart(3, "0")}${item.detected_region === "E" ? "E" : ""}`
                        : "Serial unreadable";
                      return (
                        <div className={`bulk-item bulk-item-${item.status}`} key={item.id}>
                          <div>
                            <strong>{item.card?.name || item.original_filename}</strong>
                            <span>{item.card?.name ? number : statusLabel(item.status)}</span>
                          </div>
                          <div className="bulk-item-result">
                            {Number.isInteger(item.confidence) && <small>{item.confidence}%</small>}
                            {item.submission_status === "approved" ? (
                              <span className="bulk-published-label">Published</span>
                            ) : item.submission_status === "rejected" ? (
                              <span>Rejected</span>
                            ) : item.submission_id ? (
                              <button type="button" className="bulk-open-item" onClick={() => viewItem(item)}>
                                Review &amp; approve
                              </button>
                            ) : ["needs_review", "error"].includes(item.status) ? (
                              <button type="button" className="bulk-open-item" onClick={() => viewItem(item)}>
                                Review &amp; approve
                              </button>
                            ) : <span>{statusLabel(item.status)}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {openItem && (
        <div className="bulk-photo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeItem(); }}>
          <section className="bulk-photo-modal" role="dialog" aria-modal="true" aria-labelledby="bulk-photo-title">
            <button type="button" className="bulk-photo-modal-close" onClick={closeItem} aria-label="Close photo">×</button>
            <div className="bulk-photo-modal-image">
              {openingPhoto && <p>Opening photo…</p>}
              {openPhotoUrl && (
                <BulkCropEditor
                  key={openItem.id}
                  src={openPhotoUrl}
                  alt={openItem.original_filename}
                  value={openItem.display_crop}
                  onCommit={saveDisplayCrop}
                  saving={cropSaving}
                  error={cropError}
                />
              )}
            </div>
            <div className="bulk-photo-modal-details">
              <p className="eyebrow">Review bulk card</p>
              <h2 id="bulk-photo-title">{openItem.card?.name || openItem.original_filename}</h2>
              <p>Check the suggested card, serial number and region against the original photo. You can publish it directly from here.</p>
              <dl>
                <div><dt>File</dt><dd>{openItem.original_filename}</dd></div>
                <div><dt>AI confidence</dt><dd>{Number.isInteger(openItem.confidence) ? `${openItem.confidence}%` : "Not available"}</dd></div>
              </dl>
              <div className="bulk-identify-form">
                <label>Card
                  <select value={manualCardId} onChange={(event) => {
                    const value = event.target.value;
                    setManualCardId(value);
                    const selected = cards.find((card) => String(card.id) === value);
                    setManualRegion((current) => selected?.set?.serial_scheme === "global"
                      ? "GLOBAL"
                      : current === "GLOBAL" ? "AMERICAS" : current);
                  }}>
                    <option value="">Choose card</option>
                    {cards.map((card) => <option key={card.id} value={card.id}>{card.name} — {card.set?.name}</option>)}
                  </select>
                </label>
                <label>Serial number
                  <input type="number" min="1" inputMode="numeric" value={manualSerial} onChange={(event) => setManualSerial(event.target.value)} />
                </label>
                <label>Region
                  <select value={manualRegion} onChange={(event) => setManualRegion(event.target.value)}>
                    {cards.find((card) => String(card.id) === manualCardId)?.set?.serial_scheme === "global" ? (
                      <option value="GLOBAL">Global</option>
                    ) : <><option value="AMERICAS">Americas</option><option value="E">E-Region</option></>}
                  </select>
                </label>
                <div className="bulk-identify-actions">
                  <button type="button" onClick={() => saveIdentification(true)} disabled={Boolean(savingAction) || cropSaving || openingPhoto || !openPhotoUrl}>
                    {savingAction === "approve" ? "Approving…" : "Approve and publish"}
                  </button>
                  <button type="button" className="secondary-button" onClick={() => saveIdentification(false)} disabled={Boolean(savingAction) || cropSaving}>
                    {savingAction === "pending" ? "Sending…" : "Save to Pending Approvals"}
                  </button>
                </div>
              </div>
              <button type="button" className="secondary-button" onClick={closeItem} disabled={Boolean(savingAction)}>Close</button>
              {!openItem.submission_id && <button type="button" className="bulk-reject-button" onClick={rejectItem} disabled={Boolean(savingAction)}>Reject from bulk upload</button>}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
