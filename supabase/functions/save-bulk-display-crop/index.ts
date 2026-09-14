import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.115.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clean(value: unknown, max = 80) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max)
    : "";
}

function jwtAssuranceLevel(token: string) {
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return null;
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded))?.aal || null;
  } catch {
    return null;
  }
}

function normaliseDisplayCrop(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const crop = value as Record<string, unknown>;
  const safety = Number(crop.safety);
  if (Number(crop.version) !== 1 || !Number.isFinite(safety) || safety < 0.02 || safety > 0.03) return null;
  if (!Array.isArray(crop.corners) || crop.corners.length !== 4) return null;
  const corners = crop.corners.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    const point = entry as Record<string, unknown>;
    const x = Number(point.x);
    const y = Number(point.y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return null;
    return { x, y };
  });
  if (corners.some((point) => !point)) return null;
  if (!crop.frame || typeof crop.frame !== "object" || Array.isArray(crop.frame)) return null;
  const sourceFrame = crop.frame as Record<string, unknown>;
  const frame = {
    cx: Number(sourceFrame.cx), cy: Number(sourceFrame.cy),
    width: Number(sourceFrame.width), height: Number(sourceFrame.height),
    rotation: Number(sourceFrame.rotation),
  };
  if (!Object.values(frame).every(Number.isFinite)
    || frame.cx < 0 || frame.cx > 1 || frame.cy < 0 || frame.cy > 1
    || frame.width < 0.12 || frame.width > 1 || frame.height < 0.12 || frame.height > 1
    || frame.rotation < -180 || frame.rotation > 180) return null;
  return { version: 1, safety, corners, frame };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!projectUrl || !serviceRoleKey) return json({ error: "Crop saving is not configured" }, 503);

  const accessToken = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken || jwtAssuranceLevel(accessToken) !== "aal2") {
    return json({ error: "Owner session required" }, 403);
  }

  const supabase = createClient(projectUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData } = await supabase.auth.getUser(accessToken);
  const userId = userData?.user?.id || "";
  if (!userId) return json({ error: "Owner session required" }, 403);
  const { data: owner } = await supabase.from("admins")
    .select("user_id").eq("user_id", userId).eq("is_owner", true).maybeSingle();
  if (!owner) return json({ error: "Owner access required" }, 403);

  let requestBody: Record<string, unknown> = {};
  try { requestBody = await req.json(); } catch { requestBody = {}; }
  const itemId = clean(requestBody.item_id);
  const displayCrop = normaliseDisplayCrop(requestBody.display_crop);
  if (!itemId || !displayCrop) return json({ error: "The crop frame is not valid" }, 400);

  const { data: item } = await supabase.from("bulk_upload_items")
    .select("id,batch_id,status,submission_id").eq("id", itemId).maybeSingle();
  if (!item || !["ready", "needs_review", "error"].includes(item.status)) {
    return json({ error: "This bulk item is no longer available for editing" }, 409);
  }
  const { data: batch } = await supabase.from("bulk_upload_batches")
    .select("uploaded_by").eq("id", item.batch_id).maybeSingle();
  if (!batch || batch.uploaded_by !== userId) return json({ error: "Owner access required" }, 403);

  const { error: cropError } = await supabase.from("bulk_upload_items")
    .update({ display_crop: displayCrop }).eq("id", item.id);
  if (cropError) return json({ error: "The crop could not be saved" }, 500);
  if (item.submission_id) {
    const { error: submissionCropError } = await supabase.from("submissions")
      .update({ display_crop: displayCrop }).eq("id", item.submission_id).eq("status", "pending");
    if (submissionCropError) return json({ error: "The crop could not be applied to the pending card" }, 500);
  }
  return json({ saved: true, display_crop: displayCrop });
});
