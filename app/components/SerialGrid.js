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
  const gridUrlRef = useRef(null);

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
    return () => window.removeEventListener("popstate", handlePopState);
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
    setSelectedSerial({
      id: serial.id,
      label: formatSerial(serial, total),
      region_label: getRegionLabel(serial.region),
    });
  };

  const closeSerial = useCallback(() => {
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
    <div className={`serial-grid${isYugioh ? " yugioh-serial-grid" : ""}`}>
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
      <SerialDetailModal serial={selectedSerial} card={cardSummary} onClose={closeSerial} />
    </div>
  );
}
