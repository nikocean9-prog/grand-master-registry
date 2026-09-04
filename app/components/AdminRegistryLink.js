"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminRegistryLink({ className = "nav-link nav-link-secondary" }) {
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
    <Link
      href={isAdmin ? "/admin/dashboard" : "/admin"}
      className={className}
    >
      {isAdmin ? "Admin Home" : "Admin Login"}
    </Link>
  );
}
