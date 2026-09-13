"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { getCurrentAdmin } from "../lib/adminAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminSpecialMentionsLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    getCurrentAdmin(supabase).then((admin) => {
      if (active) setIsAdmin(Boolean(admin));
    });

    return () => {
      active = false;
    };
  }, []);

  if (!isAdmin) return null;

  return <Link href="/admin/special-mentions">Special Mentions</Link>;
}
