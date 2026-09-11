"use client";

import { useEffect, useRef, useState } from "react";

const serialDetailRequests = new Map();

export function preloadSerialDetails(serialId) {
  if (!serialId) return Promise.resolve(null);
  if (serialDetailRequests.has(serialId)) return serialDetailRequests.get(serialId);

  const request = fetch(`/api/serials/${serialId}`)
    .then(async (response) => {
      if (!response.ok) throw new Error("This confirmed serial could not be loaded.");
      const data = await response.json();
      if (data.evidence_url && typeof window !== "undefined") {
        const evidenceImage = new Image();
        evidenceImage.decoding = "async";
        evidenceImage.src = data.evidence_url;
      }
      return data;
    })
    .catch((error) => {
      serialDetailRequests.delete(serialId);
      throw error;
    });

  serialDetailRequests.set(serialId, request);
  return request;
}

export default function SerialDetailModal({ serial, card, onClose }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!serial) return;

    let active = true;
    setDetails(null);
    setError("");

    preloadSerialDetails(serial.id)
      .then((data) => { if (active) setDetails(data); })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      active = false;
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [serial, onClose]);

  if (!serial) return null;

  const displayedCard = details?.card || card;
  const displayedSerial = details?.serial || serial;
  const isOneRing001 = displayedCard?.name === "The One Ring"
    && ["1", "01", "001", "001/001"].includes(displayedSerial.label);

  return (
    <div className="serial-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="serial-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="serial-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button ref={closeButtonRef} type="button" className="serial-modal-close" onClick={onClose} aria-label="Close serial details">×</button>

        <header className="serial-modal-heading">
          {displayedCard?.image_url && <img src={displayedCard.image_url} alt="" />}
          <div>
            <span className="confirmed-badge">Confirmed</span>
            <h2 id="serial-modal-title">{displayedCard?.name || "Confirmed serial"}</h2>
            <p>Serial {displayedSerial.label}</p>
          </div>
        </header>

        {error ? <div className="serial-modal-loading"><strong>Serial unavailable</strong><p>{error}</p></div> : (
          <div className="serial-modal-content serial-modal-content-compact">
            <section className="serial-info-card serial-info-card-compact">
              <h3>Registry details</h3>
              <dl>
                <div><dt>Serial</dt><dd>{displayedSerial.label}</dd></div>
                <div><dt>Region</dt><dd>{displayedSerial.region_label}</dd></div>
                {details?.submission?.country && <div><dt>Country</dt><dd>{details.submission.country}</dd></div>}
                {details?.serial.confirmed_at && <div><dt>Confirmed</dt><dd>{new Date(details.serial.confirmed_at).toLocaleDateString()}</dd></div>}
              </dl>
              {details?.submission?.source_url && <a href={details.submission.source_url} target="_blank" rel="noopener noreferrer" className="source-link">View original source ↗</a>}
              {isOneRing001 && (
                <a href="https://icv2.com/articles/news/view/54758/post-malone-buys-magic-the-gatherings-the-one-ring-001-001" target="_blank" rel="noopener noreferrer" className="source-link">
                  Ownership source ↗
                </a>
              )}
            </section>

            <section className="evidence-panel">
              {!details ? <div className="serial-modal-photo-loading">Loading photo…</div> : details.evidence_url ? (
                <a href={details.evidence_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={details.evidence_url}
                    alt={`${displayedCard?.name || "Card"} ${displayedSerial.label}`}
                    className="evidence-image"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                  />
                </a>
              ) : <p>No public card photo available.</p>}
            </section>
          </div>
        )}

        <style jsx global>{`
          .serial-modal-content-compact {
            gap: 14px;
          }

          .serial-info-card-compact {
            padding: 16px 18px;
          }

          .serial-info-card-compact h3 {
            margin-bottom: 8px;
            font-size: 19px;
          }

          .serial-info-card-compact dl {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            border-top: 1px solid #eee;
          }

          .serial-info-card-compact dl div {
            display: block;
            min-width: 0;
            border-top: 0;
            padding: 9px 0;
          }

          .serial-info-card-compact dl div:nth-child(odd) {
            padding-right: 14px;
          }

          .serial-info-card-compact dl div:nth-child(even) {
            border-left: 1px solid #eee;
            padding-left: 14px;
          }

          .serial-info-card-compact dt {
            margin-bottom: 2px;
            font-size: 13px;
          }

          .serial-info-card-compact dd {
            overflow-wrap: anywhere;
            text-align: left;
            font-size: 16px;
          }
        `}</style>
      </section>
    </div>
  );
}
