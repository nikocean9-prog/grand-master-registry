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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const admin = await getCurrentAdmin(supabase);
      setIsAdmin(Boolean(admin));
    }

    checkAdmin();
  }, []);

  if (!isAdmin) {
    return null;
  }

  return (
    <p>
      <Link
        href="/admin/dashboard"
        style={{
          display: "inline-block",
          border: "1px solid #333",
          padding: "8px 14px",
          textDecoration: "none",
        }}
      >
        ← Back to Admin Home
      </Link>
    </p>
  );
}
