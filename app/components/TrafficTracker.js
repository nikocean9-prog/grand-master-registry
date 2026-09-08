"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function TrafficTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const recentKey = `tst_page_view:${pathname}`;
    const lastTracked = Number(window.sessionStorage.getItem(recentKey) || 0);
    if (Date.now() - lastTracked < 2_000) return;
    window.sessionStorage.setItem(recentKey, String(Date.now()));

    async function recordView() {
      try {
        let referrerHost = null;
        if (document.referrer) {
          try {
            const referrer = new URL(document.referrer);
            if (referrer.host !== window.location.host) referrerHost = referrer.host;
          } catch {
            referrerHost = null;
          }
        }

        await supabase.functions.invoke("track-page-view", {
          body: {
            path: pathname,
            referrer_host: referrerHost,
          },
        });
      } catch {
        // Analytics must never interrupt browsing.
      }
    }

    recordView();
  }, [pathname]);

  return null;
}
