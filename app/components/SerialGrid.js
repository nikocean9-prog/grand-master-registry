"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import SerialDetailModal from "./SerialDetailModal";

export default function SerialGrid({ serials, total = 100 }) {
  const [selectedSerialId, setSelectedSerialId] = useState(null);
  const gridUrlRef = useRef(null);

  useEffect(() => {
    const handlePopState = (event) => {
      const modalId = event.state?.serialModalId;
      setSelectedSerialId(
        modalId && serials.some((serial) => serial.id === modalId) ? modalId : null
      );
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [serials]);

  const openSerial = (event, serialId) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    gridUrlRef.current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.pushState(
      { ...window.history.state, serialModalId: serialId },
      "",
      `/serial/${serialId}`
    );
    setSelectedSerialId(serialId);
  };

  const closeSerial = useCallback(() => {
    if (window.history.state?.serialModalId) {
      window.history.back();
      return;
    }

    setSelectedSerialId(null);
    if (gridUrlRef.current) {
      window.history.replaceState(window.history.state, "", gridUrlRef.current);
    }
  }, []);

  const formatNumber = (number, region) => {
    const formatted = String(number).padStart(total < 100 ? 2 : 3, "0");
    return region === "E" ? `${formatted}E` : formatted;
  };

  return (
    <div className="serial-grid">
      {serials.map((serial) => {
        const serialLabel = formatNumber(
          serial.serial_number,
          serial.region
        );
        const key = `${serial.region}-${serial.serial_number}`;

        if (serial.status === "confirmed") {
          return (
            <Link
              key={key}
              href={`/serial/${serial.id}`}
              className="serial-box confirmed"
              title="Confirmed — view details"
              onClick={(event) => openSerial(event, serial.id)}
            >
              {serialLabel}
            </Link>
          );
        }

        return (
          <div
            key={key}
            className="serial-box unreported"
            title="Not yet reported"
          >
            {serialLabel}
          </div>
        );
      })}
      <SerialDetailModal serialId={selectedSerialId} onClose={closeSerial} />
    </div>
  );
}
