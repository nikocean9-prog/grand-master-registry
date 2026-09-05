"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function SerialGrid({ serials, total = 100 }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      const admin = await getCurrentAdmin(supabase);

      if (active) {
        setIsAdmin(Boolean(admin));
      }
    }

    checkAdmin();

    return () => {
      active = false;
    };
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
            >
              {serialLabel}
            </Link>
          );
        }

        if (serial.status === "reported" && isAdmin) {
          return (
            <Link
              key={key}
              href="/admin/approvals"
              className="serial-box reported"
              title="Awaiting verification — open Pending Approvals"
            >
              {serialLabel}
            </Link>
          );
        }

        return (
          <div
            key={key}
            className={`serial-box ${serial.status}`}
            title={
              serial.status === "reported"
                ? "Reported — awaiting verification"
                : "Not yet reported"
            }
          >
            {serialLabel}
          </div>
        );
      })}
    </div>
  );
}
