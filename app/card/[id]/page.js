import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export default async function CardPage({ params }) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: card, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !card) {
    return (
      <main>
        <Link href="/">← Back to Registry</Link>
        <h1>Card not found</h1>
      </main>
    );
  }

  return (
    <main>
      <Link href="/">← Back to Registry</Link>

      <h1>{card.name}</h1>

      <h2>Confirmed Pulls</h2>

      <p>
        This page will track every confirmed Grand Master Rare pull for
        {` ${card.name}`}.
      </p>

      <p>Card ID: {card.id}</p>
    </main>
  );
}
