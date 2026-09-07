"use client";

import { useEffect, useRef, useState } from "react";

export default function SerialDetailModal({ serialId, onClose }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState("");
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!serialId) return;

    const controller = new AbortController();
    setDetails(null);
    setError("");

    fetch(`/api/serials/${serialId}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("This confirmed serial could not be loaded.");
        return response.json();
      })
      .then(setDetails)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      controller.abort();
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [serialId, onClose]);

  if (!serialId) return null;

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

        {!details && !error && <div className="serial-modal-loading">Loading confirmed serial…</div>}
        {error && <div className="serial-modal-loading"><strong>Serial unavailable</strong><p>{error}</p></div>}

        {details && (
          <>
            <header className="serial-modal-heading">
              {details.card.image_url && <img src={details.card.image_url} alt="" />}
              <div>
                <span className="confirmed-badge">Confirmed</span>
                <h2 id="serial-modal-title">{details.card.name}</h2>
                <p>Serial {details.serial.label}</p>
              </div>
            </header>

            <div className="serial-modal-content">
              <section className="serial-info-card">
                <h3>Registry details</h3>
                <dl>
                  <div><dt>Serial</dt><dd>{details.serial.label}</dd></div>
                  <div><dt>Region</dt><dd>{details.serial.region_label}</dd></div>
                  {details.submission?.country && <div><dt>Country</dt><dd>{details.submission.country}</dd></div>}
                  {details.serial.confirmed_at && <div><dt>Confirmed</dt><dd>{new Date(details.serial.confirmed_at).toLocaleDateString()}</dd></div>}
                </dl>
                {details.submission?.source_url && <a href={details.submission.source_url} target="_blank" rel="noopener noreferrer" className="source-link">View original source ↗</a>}
              </section>

              <section className="evidence-panel">
                {details.evidence_url ? (
                  <a href={details.evidence_url} target="_blank" rel="noopener noreferrer">
                    <img src={details.evidence_url} alt={`${details.card.name} ${details.serial.label}`} className="evidence-image" />
                  </a>
                ) : <p>No public card photo available.</p>}
              </section>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
