import { createClient } from "@supabase/supabase-js";
import { tcgs } from "./lib/catalog";
import { wikiArticles } from "./lib/wikiArticles";

const origin = "https://www.tcgserialtracker.com";
export const revalidate = 3600;

export default async function sitemap() {
  const now = new Date();
  const staticPages = [
    ["", "daily", 1],
    ["/tcgs", "weekly", 0.9],
    ["/gallery", "daily", 0.8],
    ["/serialized-cards", "weekly", 0.9],
    ["/yugioh/serialised-cards", "daily", 0.9],
    ["/wiki", "weekly", 0.8],
    ["/help", "monthly", 0.4],
    ["/disclaimer", "yearly", 0.2],
  ].map(([path, changeFrequency, priority]) => ({
    url: `${origin}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const liveTcgs = tcgs.filter((tcg) =>
    tcg.sets.some((set) => set.status === "live")
  );
  const tcgPages = liveTcgs.map((tcg) => ({
    url: `${origin}/tcg/${tcg.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  const setPages = liveTcgs
    .flatMap((tcg) => tcg.sets)
    .filter((set) => set.status === "live")
    .map((set) => ({
      url: `${origin}/sets/${set.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    }));
  const wikiPages = wikiArticles.map((article) => ({
    url: `${origin}/wiki/${article.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return [...staticPages, ...tcgPages, ...setPages, ...wikiPages];
  }
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [{ data: cards }, { data: serials }] = await Promise.all([
    supabase.from("cards").select("id"),
    supabase.from("serials").select("id, confirmed_at").eq("status", "confirmed"),
  ]);
  const cardPages = (cards || []).map((card) => ({
    url: `${origin}/card/${card.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
  const serialPages = (serials || []).map((serial) => ({
    url: `${origin}/serial/${serial.id}`,
    lastModified: serial.confirmed_at ? new Date(serial.confirmed_at) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...tcgPages, ...setPages, ...wikiPages, ...cardPages, ...serialPages];
}
