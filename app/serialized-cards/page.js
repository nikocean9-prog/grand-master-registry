import Link from "next/link";
import PublicHeader from "../components/PublicHeader";
import { tcgs } from "../lib/catalog";

export const metadata = {
  title: "Serialized Cards: TCG Sets, Card Lists & Confirmed Pulls",
  description:
    "Explore serialized trading cards across Yu-Gi-Oh!, Magic: The Gathering, Star Wars: Unlimited, Flesh and Blood and Digimon, with complete card lists and confirmed pulls.",
  alternates: { canonical: "/serialized-cards" },
  openGraph: {
    title: "Serialized Cards: TCG Sets, Card Lists & Confirmed Pulls",
    description:
      "Browse serialized card sets, complete checklists and confirmed serial-numbered pulls across major trading card games.",
    url: "/serialized-cards",
  },
};

export default function SerializedCardsGuide() {
  const liveTcgs = tcgs.filter((tcg) =>
    tcg.sets.some((set) => set.status === "live")
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Serialized Trading Card Registry",
    url: "https://www.tcgserialtracker.com/serialized-cards",
    description:
      "A collection of serialized trading-card set lists and confirmed pull records.",
    hasPart: liveTcgs.map((tcg) => ({
      "@type": "CollectionPage",
      name: `${tcg.name} Serialized Card Registry`,
      url: `https://www.tcgserialtracker.com/tcg/${tcg.slug}`,
    })),
  };

  return (
    <main>
      <PublicHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="simple-hero">
        <p className="eyebrow">Card collector guide</p>
        <h1>Serialized trading cards</h1>
        <p>
          Explore individually numbered cards by game, set and serial number.
          Each registry shows the complete print run and confirmed collector
          submissions.
        </p>
      </section>

      <section className="legal-content">
        <h2>What is a serialized card?</h2>
        <p>
          A serialized or serialised card is printed with its own number within
          a limited run, such as 025/100 or 001/500. That number identifies one
          physical copy from the stated print quantity.
        </p>

        <h2>Browse serialized card registries</h2>
        <ul>
          {liveTcgs.map((tcg) => {
            const setCount = tcg.sets.filter(
              (set) => set.status === "live"
            ).length;
            return (
              <li key={tcg.slug}>
                <Link href={`/tcg/${tcg.slug}`}>
                  {tcg.name} serialized cards
                </Link>
                {" — "}
                {setCount} live {setCount === 1 ? "set" : "sets"}
              </li>
            );
          })}
        </ul>

        <h2>Yu-Gi-Oh! serialized cards</h2>
        <p>
          The Yu-Gi-Oh! registry begins with the Grand Master Rares from
          Magnificent Monsters, covering both Americas-distributed numbers and
          European-distributed copies carrying the E suffix.
        </p>
        <p>
          <Link href="/sets/magnificent-monsters">
            View the Magnificent Monsters serialized card list
          </Link>
        </p>

        <h2>Magic: The Gathering serialized cards</h2>
        <p>
          The Magic registry covers individually numbered cards from releases
          including The Brothers&apos; War, March of the Machine, The Lord of the
          Rings, Doctor Who, Assassin&apos;s Creed and other serialized sets.
        </p>
        <p>
          <Link href="/tcg/magic-the-gathering">
            Browse every Magic: The Gathering serialized set
          </Link>
        </p>

        <h2>How confirmed pulls are recorded</h2>
        <p>
          Collector submissions are reviewed before a serial number is marked
          as confirmed. Confirmed records can include the evidence photograph,
          region, country, date and original public source when available.
        </p>
        <p>
          <Link href="/submit">Submit a serialized card pull</Link>
        </p>
      </section>
    </main>
  );
}
