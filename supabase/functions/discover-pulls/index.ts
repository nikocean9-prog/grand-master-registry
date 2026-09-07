import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function tokenClaims(token: string) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}

function sourceDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function safeSourceUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function detectedSerial(text: string, maximum: number) {
  const matches = [...text.matchAll(/\b(\d{1,4})\s*\/\s*(\d{1,4})\b/g)];
  const exact = matches.find((match) => Number(match[2]) === maximum);
  if (!exact) return null;
  return `${String(Number(exact[1])).padStart(3, "0")}/${exact[2]}`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openAiKey) return json({ error: "Web discovery is not configured" }, 503);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const cronSecret = request.headers.get("x-discovery-cron-secret") || "";
  const { data: cronSecretValid } = cronSecret
    ? await admin.rpc("verify_discovery_cron_secret", { p_secret: cronSecret })
    : { data: false };
  const scheduledRun = cronSecretValid === true;
  let ownerId = "";

  if (scheduledRun) {
    const { data: owner } = await admin
      .from("admins")
      .select("user_id")
      .eq("is_owner", true)
      .limit(1)
      .maybeSingle();
    if (!owner) return json({ error: "No owner account is configured" }, 503);
    ownerId = owner.user_id;
  } else {
    if (!token) return json({ error: "Authentication required" }, 401);
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Invalid session" }, 401);
    if (tokenClaims(token).aal !== "aal2") return json({ error: "MFA verification required" }, 403);

    const { data: owner } = await admin
      .from("admins")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .eq("is_owner", true)
      .maybeSingle();
    if (!owner) return json({ error: "Owner access required" }, 403);
    ownerId = userData.user.id;
  }

  const body = await request.json().catch(() => ({}));
  const maxCards = Math.min(Math.max(Number(body?.max_cards) || 3, 1), 5);
  const setSlug = typeof body?.set_slug === "string" ? body.set_slug.trim() : "";
  const requestedCardIds = Array.isArray(body?.card_ids)
    ? body.card_ids.map(Number).filter(Number.isInteger).slice(0, 5)
    : [];
  const batchIndex = Number.isInteger(Number(body?.batch_index))
    ? Math.min(Math.max(Number(body.batch_index), 0), 5)
    : null;

  let cardQuery = admin
    .from("cards")
    .select("id, name, serial_total, card_sets!inner(slug, name, status)")
    .eq("card_sets.status", "live")
    .order("id");
  if (setSlug) cardQuery = cardQuery.eq("card_sets.slug", setSlug);
  if (requestedCardIds.length) cardQuery = cardQuery.in("id", requestedCardIds);

  const { data: cards, error: cardsError } = await cardQuery;
  if (cardsError || !cards?.length) {
    return json({ error: cardsError?.message || "No cards found for that set" }, 400);
  }
  const selectedCards = requestedCardIds.length
    ? cards
    : batchIndex !== null && setSlug
      ? cards.slice(batchIndex * maxCards, batchIndex * maxCards + maxCards)
      : [...cards].sort(() => Math.random() - 0.5).slice(0, maxCards);
  if (!selectedCards.length) return json({ error: "This scheduled batch has no cards" }, 400);

  const { data: run, error: runError } = await admin
    .from("discovery_runs")
    .insert({ started_by: ownerId, status: "running" })
    .select("id")
    .single();
  if (runError || !run) return json({ error: "Could not create discovery run" }, 500);

  let saved = 0;
  try {
    for (const card of selectedCards) {
      const cardSet = Array.isArray(card.card_sets) ? card.card_sets[0] : card.card_sets;
      const prompt = `Search the public web for recent collector posts, auction listings, videos, or social posts that explicitly show or claim a pulled serialized copy of the Magic or Yu-Gi-Oh! card "${card.name}" from "${cardSet?.name || "its set"}". Its valid serial range ends at /${card.serial_total}. Exclude generic card databases, price guides, set checklists, articles merely announcing the serialized release, and TCG Serial Tracker itself. Return a short factual list of genuine candidate sightings only. Include the visible serial number when the source states it. If there are no credible sightings, say none found.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5-search-api",
          web_search_options: { search_context_size: "low" },
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!response.ok) throw new Error(`Web search failed with status ${response.status}`);

      const result = await response.json();
      const message = result?.choices?.[0]?.message;
      const summary = typeof message?.content === "string" ? message.content.slice(0, 5000) : "";
      const annotations = Array.isArray(message?.annotations) ? message.annotations : [];
      const candidates = annotations
        .map((annotation: any) => annotation?.url_citation)
        .map((citation: any) => citation ? { ...citation, url: safeSourceUrl(citation.url) } : null)
        .filter((citation: any) => citation?.url && citation?.title)
        .filter((citation: any, index: number, all: any[]) =>
          all.findIndex((item) => item.url === citation.url) === index
        );

      for (const citation of candidates) {
        const serial = detectedSerial(summary, card.serial_total);
        const { error } = await admin.from("pull_discoveries").upsert({
          run_id: run.id,
          card_id: card.id,
          source_url: citation.url,
          source_domain: sourceDomain(citation.url),
          source_title: String(citation.title).slice(0, 500),
          search_summary: summary,
          detected_serial: serial,
          confidence: serial ? 82 : 55,
          status: "candidate",
        }, { onConflict: "card_id,source_url", ignoreDuplicates: true });
        if (!error) saved += 1;
      }
    }

    await admin.from("discovery_runs").update({
      status: "completed",
      cards_searched: selectedCards.length,
      results_found: saved,
      completed_at: new Date().toISOString(),
    }).eq("id", run.id);
    return json({ run_id: run.id, cards_searched: selectedCards.length, results_found: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery search failed";
    await admin.from("discovery_runs").update({
      status: "failed",
      cards_searched: selectedCards.length,
      results_found: saved,
      error_message: message.slice(0, 1000),
      completed_at: new Date().toISOString(),
    }).eq("id", run.id);
    return json({ error: message }, 502);
  }
});
