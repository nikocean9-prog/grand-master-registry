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
  const gridUrlRef = useRef(null);
  const transitionTimerRef = useRef(null);

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
      if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    };
  }, [serials, total]);

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
    const finalWidth = Math.min(window.innerWidth * 0.52, 238);
    const scale = finalWidth / sourceRect.width;
    const endX = (window.innerWidth - finalWidth) / 2;
    const endY = Math.max(72, Math.min(window.innerHeight * 0.2, 180));

    setSelectedSerial(nextSerial);
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

    transitionTimerRef.current = window.setTimeout(() => {
      setCardTransition(null);
      transitionTimerRef.current = null;
    }, 720);
  };

  const closeSerial = useCallback(() => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
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
    <div className={`serial-grid${isYugioh ? " yugioh-serial-grid" : ""}${cardSummary?.enableCardTransition ? " magnificent-monsters-card-transition" : ""}`}>
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
              onPointerEnter={() => { preloadSerialDetails(serial.id).catch(() => {}); }}
              onFocus={() => { preloadSerialDetails(serial.id).catch(() => {}); }}
              onTouchStart={() => { preloadSerialDetails(serial.id).catch(() => {}); }}
              onClick={(event) => openSerial(event, serial)}
              data-transition-source={cardTransition?.id === serial.id ? "true" : undefined}
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
      <SerialDetailModal serial={selectedSerial} card={cardSummary} onClose={closeSerial} isOpening={Boolean(cardTransition)} />
    </div>
  );
}
