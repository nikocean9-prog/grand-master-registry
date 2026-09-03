import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { count, error: countError } = await supabase
    .from("serials")
    .select("*", { count: "exact", head: true })
    .eq("status", "confirmed");

  const { data: cards, error: cardsError } = await supabase
  .from("cards")
  .select(`
    id,
    name,
    serials (
      status
    )
  `)
  .order("id");

  const confirmed = count ?? 0;
  const total = 3600;
  const percentage = ((confirmed / total) * 100).toFixed(1);

  return (
    <main>
      <h1>Grand Master Registry</h1>

      <p>
        Track the Yu-Gi-Oh! Magnificent Monsters Grand Master Rares
        that have been pulled around the world.
      </p>

      {countError ? (
        <p>Database connection needs to be configured.</p>
      ) : (
        <>
          <h2>{confirmed.toLocaleString()} / 3,600 Confirmed</h2>
          <p>{percentage}% of the worldwide Grand Master print run documented</p>
        </>
      )}

      <Link href="/submit">
  <button>Submit a Pull</button>
</Link>

      <hr />

      <h2>Magnificent Monsters</h2>

      {cardsError ? (
        <p>Could not load cards.</p>
      ) : (
        <div>
         {cards?.map((card) => {
  const cardConfirmed =
    card.serials?.filter((serial) => serial.status === "confirmed").length ?? 0;

  const cardPercentage = ((cardConfirmed / 200) * 100).toFixed(1);

  return (
    <div key={card.id}>
      <h3>
        <Link href={`/card/${card.id}`}>
          {card.name}
        </Link>
      </h3>

      <p>
        {cardConfirmed} / 200 confirmed · {cardPercentage}%
      </p>
    </div>
  );
})}
        </div>
      )}
    </main>
  );
}
