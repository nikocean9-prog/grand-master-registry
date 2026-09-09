import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEvidenceUrl } from "../../../lib/evidenceUrl";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: serial } = await supabase
    .from("serials")
    .select("id, card_id, serial_number, region, status, confirmed_at")
    .eq("id", id)
    .eq("status", "confirmed")
    .maybeSingle();

  if (!serial) {
    return NextResponse.json({ error: "Confirmed serial not found" }, { status: 404 });
  }

  const [{ data: card }, { data: submission }] = await Promise.all([
    supabase.from("cards").select("id, name, image_url, serial_total").eq("id", serial.card_id).single(),
    supabase
      .from("submissions")
      .select("photo_url, country, source_url, created_at, status")
      .eq("serial_id", serial.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const evidenceUrl = await getEvidenceUrl(supabase, submission?.photo_url);
  const number = String(serial.serial_number).padStart((card.serial_total || 100) < 100 ? 2 : 3, "0");
  const label = serial.region === "E" ? `${number}E` : number;
  const regionLabel = serial.region === "GLOBAL" ? "Worldwide" : serial.region === "E" ? "Europe-distributed" : "Americas";

  return NextResponse.json({
    card,
    serial: { label, region_label: regionLabel, confirmed_at: serial.confirmed_at },
    submission: submission ? { country: submission.country, source_url: submission.source_url } : null,
    evidence_url: evidenceUrl,
  });
}
