import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.115.0";

const allowedOrigins = new Set([
  "https://www.tcgserialtracker.com",
  "https://tcgserialtracker.com",
]);

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin || "")
      ? origin!
      : "https://www.tcgserialtracker.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function response(status: number, origin: string | null) {
  return new Response(null, { status, headers: corsHeaders(origin) });
}

async function hashVisitor(ip: string, userAgent: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${ip}|${userAgent.slice(0, 300)}`)
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return response(204, origin);
  if (req.method !== "POST") return response(405, origin);
  if (origin && !allowedOrigins.has(origin)) return response(403, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return response(503, origin);

  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim();
  if (!ip) return response(204, origin);

  let body: { path?: unknown; referrer_host?: unknown };
  try {
    body = await req.json();
  } catch {
    return response(400, origin);
  }

  const path = typeof body.path === "string" ? body.path : "";
  const referrerHost =
    typeof body.referrer_host === "string" ? body.referrer_host : null;
  if (!/^\/[A-Za-z0-9/_-]*$/.test(path) || path.length > 240 || path.startsWith("/admin")) {
    return response(400, origin);
  }

  const visitorHash = await hashVisitor(
    ip,
    req.headers.get("user-agent") || "unknown",
    serviceRoleKey
  );
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.rpc("record_page_view", {
    p_visitor_hash: visitorHash,
    p_path: path,
    p_referrer_host: referrerHost,
  });

  if (error) {
    console.error("page view tracking failed", error);
    return response(500, origin);
  }

  return response(204, origin);
});
