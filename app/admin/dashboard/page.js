"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminHome() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.href = "/admin";
        return;
      }

      setLoading(false);
    }

    checkAdmin();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  if (loading) {
    return (
      <main>
        <h1>Admin Home</h1>
        <p>Loading...</p>
      </main>
    );
  }

  const linkStyle = {
    display: "block",
    border: "1px solid #ccc",
    padding: "20px",
    marginBottom: "16px",
    textDecoration: "none",
    color: "inherit",
  };

  return (
    <main>
      <h1>Admin Home</h1>
      <p>Manage registry submissions and review previous decisions.</p>

      <div style={{ maxWidth: "600px", marginTop: "25px" }}>
        <Link href="/admin/approvals" style={linkStyle}>
          <strong>Pending Approvals</strong>
          <div>Review, approve or reject new submissions.</div>
        </Link>

        <Link href="/admin/history" style={linkStyle}>
          <strong>Submission History</strong>
          <div>View all approved and rejected submissions.</div>
        </Link>

        <Link href="/" style={linkStyle}>
          <strong>View Public Registry</strong>
          <div>Open the public-facing registry.</div>
        </Link>
      </div>

      <button type="button" onClick={handleSignOut}>
        Sign Out
      </button>
    </main>
  );
}
