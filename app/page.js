import { createClient } from "@supabase/supabase-js";

export default async function Home() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { count, error } = await supabase
    .from("serials")
    .select("*", { count: "exact", head: true })
    .eq("status", "confirmed");

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

      {error ? (
        <p>Database connection needs to be configured.</p>
      ) : (
        <>
          <h2>{confirmed.toLocaleString()} / 3,600 Confirmed</h2>
          <p>{percentage}% of the worldwide Grand Master print run documented</p>
        </>
      )}

      <button>Submit a Pull</button>

      <hr />

      <h2>Magnificent Monsters</h2>

      <p>The 18 Grand Master Rares will appear here.</p>
    </main>
  );
}
