"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MAX_FILES = 50;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
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
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [message, setMessage] = useState("");
  const [openItem, setOpenItem] = useState(null);
  const [openPhotoUrl, setOpenPhotoUrl] = useState("");
  const [openingPhoto, setOpeningPhoto] = useState(false);

  const loadBatches = useCallback(async () => {
    const { data, error } = await supabase
      .from("bulk_upload_batches")
      .select(`
        id, status, total_items, processed_items, ready_items, review_items,
        created_at, updated_at,
        items:bulk_upload_items (
          id, storage_path, original_filename, status, confidence, detected_serial_number,
          detected_region, error_message, submission_id,
          card:cards ( name )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(8);

    if (!error) setBatches(data || []);
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
          <p>Upload card photos once. Each image is assessed separately and added to Pending Approvals when its card and serial can be identified.</p>
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
        ) : batches.map((batch) => (
          <article className="bulk-batch" key={batch.id}>
            <div className="bulk-batch-summary">
              <div>
                <strong>{new Date(batch.created_at).toLocaleString()}</strong>
                <span>{batch.processed_items} of {batch.total_items} assessed</span>
              </div>
              <span className={`bulk-status bulk-status-${batch.status}`}>
                {statusLabel(batch.status)}
              </span>
            </div>

            <div className="bulk-progress" aria-label={`${batch.processed_items} of ${batch.total_items} assessed`}>
              <span style={{ width: `${batch.total_items ? (batch.processed_items / batch.total_items) * 100 : 0}%` }} />
            </div>

            <div className="bulk-batch-counts">
              <span><strong>{batch.ready_items}</strong> in approvals</span>
              <span><strong>{batch.review_items}</strong> need attention</span>
            </div>

            {batch.items?.length > 0 && (
              <div className="bulk-item-list">
                {batch.items.map((item) => {
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
                        {item.submission_id ? (
                          <a href="/admin/approvals">Review</a>
                        ) : ["needs_review", "error"].includes(item.status) ? (
                          <button type="button" className="bulk-open-item" onClick={() => viewItem(item)}>
                            Open
                          </button>
                        ) : <span>{statusLabel(item.status)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        ))}
      </section>

      {openItem && (
        <div className="bulk-photo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeItem(); }}>
          <section className="bulk-photo-modal" role="dialog" aria-modal="true" aria-labelledby="bulk-photo-title">
            <button type="button" className="bulk-photo-modal-close" onClick={closeItem} aria-label="Close photo">×</button>
            <div className="bulk-photo-modal-image">
              {openingPhoto && <p>Opening photo…</p>}
              {openPhotoUrl && <img src={openPhotoUrl} alt={openItem.original_filename} />}
            </div>
            <div className="bulk-photo-modal-details">
              <p className="eyebrow">Needs identification</p>
              <h2 id="bulk-photo-title">{openItem.card?.name || openItem.original_filename}</h2>
              <p>{openItem.error_message || "The card or serial could not be identified confidently."}</p>
              <dl>
                <div><dt>File</dt><dd>{openItem.original_filename}</dd></div>
                <div><dt>AI confidence</dt><dd>{Number.isInteger(openItem.confidence) ? `${openItem.confidence}%` : "Not available"}</dd></div>
              </dl>
              <button type="button" onClick={closeItem}>Close</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
