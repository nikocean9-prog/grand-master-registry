"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import SerialDetailModal, { preloadSerialDetails } from "./SerialDetailModal";

const formatSerial = (serial, total) => {
  const formatted = String(serial.serial_number).padStart(total < 100 ? 2 : 3, "0");
  return serial.region === "E" ? `${formatted}E` : formatted;
};

const getRegionLabel = (region) => region === "GLOBAL"
  ? "Worldwide"
  : region === "E" ? "Europe-distributed" : "Americas";

export default function SerialGrid({ serials, total = 100, cardSummary, isYugioh = false }) {
  const [selectedSerial, setSelectedSerial] = useState(null);
  const [cardTransition, setCardTransition] = useState(null);
  const [transitionPendingId, setTransitionPendingId] = useState(null);
  const gridRef = useRef(null);
  const gridUrlRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const transitionFrameRef = useRef(null);
  const transitionRunRef = useRef(0);

  useEffect(() => {
    const handlePopState = (event) => {
      const modalId = event.state?.serialModalId;
      const serial = modalId ? serials.find((item) => item.id === modalId) : null;
      setSelectedSerial(serial ? {
        id: serial.id,
        label: formatSerial(serial, total),
        region_label: getRegionLabel(serial.region),
      } : null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      transitionRunRef.current += 1;
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
      if (transitionFrameRef.current) window.cancelAnimationFrame(transitionFrameRef.current);
    };
  }, [serials, total]);

  useEffect(() => {
    if (!cardSummary?.enableCardTransition) return;

    const confirmedCards = gridRef.current?.querySelectorAll(".serial-box.confirmed[data-serial-id]");
    if (!confirmedCards?.length) return;

    if (!("IntersectionObserver" in window)) {
      Array.from(confirmedCards).slice(0, 12).forEach((element) => {
        const matchingSerial = serials.find((serial) => String(serial.id) === element.dataset.serialId);
        preloadSerialDetails(element.dataset.serialId, matchingSerial?.evidence_url).catch(() => {});
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const matchingSerial = serials.find((serial) => String(serial.id) === entry.target.dataset.serialId);
        preloadSerialDetails(entry.target.dataset.serialId, matchingSerial?.evidence_url).catch(() => {});
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "900px 0px" });

    confirmedCards.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [serials, cardSummary?.enableCardTransition]);

  const openSerial = (event, serial) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    gridUrlRef.current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.pushState(
      { ...window.history.state, serialModalId: serial.id },
      "",
      `/serial/${serial.id}`
    );
    const nextSerial = {
      id: serial.id,
      label: formatSerial(serial, total),
      region_label: getRegionLabel(serial.region),
    };

    if (!cardSummary?.enableCardTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSelectedSerial(nextSerial);
      return;
    }

    const sourceRect = event.currentTarget.getBoundingClientRect();
    const transitionRun = ++transitionRunRef.current;
    const evidenceReady = preloadSerialDetails(serial.id, serial.evidence_url).catch(() => null);
    setSelectedSerial(nextSerial);
    setTransitionPendingId(serial.id);

    transitionFrameRef.current = window.requestAnimationFrame(() => {
      const photoPanel = document.querySelector(".serial-modal .evidence-panel");
      const photoRect = photoPanel?.getBoundingClientRect();
      const panelInset = photoRect ? 8 : 0;
      const availableWidth = photoRect ? Math.max(1, photoRect.width - (panelInset * 2)) : window.innerWidth;
      const finalWidth = Math.min(window.innerWidth * 0.52, 238, availableWidth);
      const scale = finalWidth / sourceRect.width;
      const endX = photoRect
        ? photoRect.left + ((photoRect.width - finalWidth) / 2)
        : (window.innerWidth - finalWidth) / 2;
      const endY = photoRect
        ? photoRect.top + panelInset
        : Math.max(72, Math.min(window.innerHeight * 0.2, 180));

      setCardTransition({
        id: serial.id,
        label: nextSerial.label,
        imageUrl: cardSummary.image_url,
        width: sourceRect.width,
        height: sourceRect.height,
        startX: sourceRect.left,
        startY: sourceRect.top,
        endX,
        endY,
        scale,
      });
      setTransitionPendingId(null);
      transitionFrameRef.current = null;

      transitionTimerRef.current = window.setTimeout(() => {
        transitionTimerRef.current = null;
        evidenceReady.finally(() => {
          if (transitionRunRef.current !== transitionRun) return;
          setCardTransition(null);
        });
      }, 720);
    });
  };

  const closeSerial = useCallback(() => {
    transitionRunRef.current += 1;
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (transitionFrameRef.current) {
      window.cancelAnimationFrame(transitionFrameRef.current);
      transitionFrameRef.current = null;
    }
    setTransitionPendingId(null);
    setCardTransition(null);

    if (window.history.state?.serialModalId) {
      window.history.back();
      return;
    }

    setSelectedSerial(null);
    if (gridUrlRef.current) {
      window.history.replaceState(window.history.state, "", gridUrlRef.current);
    }
  }, []);

  return (
    <div ref={gridRef} className={`serial-grid${isYugioh ? " yugioh-serial-grid" : ""}${cardSummary?.enableCardTransition ? " magnificent-monsters-card-transition" : ""}`}>
      {serials.map((serial) => {
        const serialLabel = formatSerial(serial, total);
        const key = `${serial.region}-${serial.serial_number}`;

        if (serial.status === "confirmed") {
          return (
            <Link
              key={key}
              href={`/serial/${serial.id}`}
              className="serial-box confirmed"
              title="Confirmed — view details"
              onPointerEnter={() => { preloadSerialDetails(serial.id, serial.evidence_url).catch(() => {}); }}
              onFocus={() => { preloadSerialDetails(serial.id, serial.evidence_url).catch(() => {}); }}
              onTouchStart={() => { preloadSerialDetails(serial.id, serial.evidence_url).catch(() => {}); }}
              onClick={(event) => openSerial(event, serial)}
              data-serial-id={serial.id}
              data-transition-source={cardTransition?.id === serial.id || transitionPendingId === serial.id ? "true" : undefined}
            >
              <span>{serialLabel}</span>
            </Link>
          );
        }

        return (
          <div
            key={key}
            className="serial-box unreported"
            title="Not yet reported"
          >
            <span>{serialLabel}</span>
          </div>
        );
      })}
      {cardTransition && (
        <div
          className="serial-card-flight"
          aria-hidden="true"
          style={{
            "--serial-flight-width": `${cardTransition.width}px`,
            "--serial-flight-height": `${cardTransition.height}px`,
            "--serial-flight-start-x": `${cardTransition.startX}px`,
            "--serial-flight-start-y": `${cardTransition.startY}px`,
            "--serial-flight-end-x": `${cardTransition.endX}px`,
            "--serial-flight-end-y": `${cardTransition.endY}px`,
            "--serial-flight-scale": cardTransition.scale,
          }}
        >
          <div className="serial-card-flight-rotor">
            <div className="serial-card-flight-face serial-card-flight-back"><span>{cardTransition.label}</span></div>
            <div className="serial-card-flight-face serial-card-flight-front">
              {cardTransition.imageUrl && <img src={cardTransition.imageUrl} alt="" />}
            </div>
          </div>
        </div>
      )}
      <SerialDetailModal serial={selectedSerial} card={cardSummary} onClose={closeSerial} isOpening={Boolean(cardTransition || transitionPendingId)} />
    </div>
  );
}
