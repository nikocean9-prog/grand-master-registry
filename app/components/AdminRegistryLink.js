"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminRegistryLink() {
  const [adminStatus, setAdminStatus] = useState("loading");

  useEffect(() => {
    async function checkAdmin() {
      const admin = await getCurrentAdmin(supabase);
      setAdminStatus(admin ? "admin" : "visitor");
    }

    checkAdmin();
  }, []);

  if (adminStatus === "loading") {
    return null;
  }

  const isAdmin = adminStatus === "admin";

  return (
    <p>
      <Link
        href={isAdmin ? "/admin/dashboard" : "/admin"}
        style={{
          display: "inline-block",
          border: "1px solid #333",
          padding: "8px 14px",
          textDecoration: "none",
        }}
      >
        {isAdmin ? "← Back to Admin Home" : "Admin Login"}
      </Link>
    </p>
  );
}
