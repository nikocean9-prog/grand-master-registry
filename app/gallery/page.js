import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import PublicHeader from "../components/PublicHeader";
import PublicPullGallery from "../components/PublicPullGallery";
import { getPublicPulls } from "../lib/publicPulls";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Confirmed Pull Gallery | TCG Serial Tracker",
  description: "Browse photographs of confirmed serial-numbered trading card pulls from the TCG Serial Tracker registry.",
};

export default async function GalleryPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = url && key
    ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
  const pulls = (await getPublicPulls(supabase, 60)).filter((pull) => pull.imageUrl);

  return (
    <main className="gallery-page">
      <PublicHeader />
      <Link href="/" className="back-link">← Back to Home</Link>
      <header className="gallery-page-heading">
        <p className="home-section-eyebrow">From the registry</p>
        <h1>Pull Gallery</h1>
        <p>Browse photographs submitted as evidence for confirmed serial-numbered cards.</p>
      </header>
      {pulls.length
        ? <PublicPullGallery pulls={pulls} />
        : <p className="home-empty-state">No confirmed pull photos are available yet.</p>}
    </main>
  );
}
