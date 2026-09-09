import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function requireOwner(request) {
  const authorization = request.headers.get("authorization") || "";
  const accessToken = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!accessToken) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: userData, error: userError } =
    await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) return null;

  const { data: admin } = await supabase
    .from("admins")
    .select("is_owner")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  return admin?.is_owner === true ? userData.user : null;
}

export async function GET(request) {
  const owner = await requireOwner(request);
  if (!owner) {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  const instagramToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!instagramToken) {
    return NextResponse.json({ connected: false, reason: "token_missing" });
  }

  try {
    const endpoint = new URL("https://graph.instagram.com/me");
    endpoint.searchParams.set("fields", "user_id,username");
    endpoint.searchParams.set("access_token", instagramToken);
    const response = await fetch(endpoint, { cache: "no-store" });
    const result = await response.json();

    if (!response.ok || result.error) {
      console.error("Instagram connection check failed", {
        status: response.status,
        code: result.error?.code,
        type: result.error?.type,
      });
      return NextResponse.json({
        connected: false,
        reason: "meta_rejected_token",
        message: "Meta did not accept the saved Instagram token.",
      });
    }

    return NextResponse.json({
      connected: true,
      username: result.username || null,
      accountId: result.user_id || result.id || null,
    });
  } catch (error) {
    console.error("Instagram connection check unavailable", error);
    return NextResponse.json(
      { connected: false, reason: "meta_unavailable" },
      { status: 502 }
    );
  }
}
