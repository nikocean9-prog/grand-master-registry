import Link from "next/link";
import PublicHeader from "../../components/PublicHeader";

export const metadata = {
  title: "Serialised Yu-Gi-Oh! Cards & Grand Master Rare Tracker",
  description:
    "Track serialised Yu-Gi-Oh! cards, confirmed Grand Master Rare pulls and every Magnificent Monsters serial number, including Americas and European E-region copies.",
  alternates: { canonical: "/yugioh/serialised-cards" },
  openGraph: {
    title: "Serialised Yu-Gi-Oh! Card Tracker",
    description:
      "Browse the complete Yu-Gi-Oh! Grand Master Rare checklist and confirmed serial-numbered card pulls.",
    url: "/yugioh/serialised-cards",
  },
};

const faqs = [
  {
    question: "What are serialised Yu-Gi-Oh! cards?",
    answer:
      "Serialised Yu-Gi-Oh! cards are individually numbered collector cards. Magnificent Monsters Grand Master Rares have a unique number within a limited print run.",
  },
  {
    question: "How many Magnificent Monsters Grand Master Rares are there?",
    answer:
      "Magnificent Monsters contains 18 Grand Master Rare cards. Each card has 200 numbered copies across the Americas and European regions, creating 3,600 serial numbers in total.",
  },
  {
    question: "What does the E mean on a Yu-Gi-Oh! serial number?",
    answer:
      "The E suffix identifies a European-region Grand Master Rare copy. The tracker records Americas and European-region serials separately.",
  },
  {
    question: "Can collectors submit a confirmed serial number?",
    answer:
      "Yes. Collectors can submit a pull with a photograph and supporting details. Each submission is reviewed before it is marked as confirmed in the public registry.",
  },
];

export default function SerialisedYugiohCardsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Serialised Yu-Gi-Oh! Card Tracker",
        url: "https://www.tcgserialtracker.com/yugioh/serialised-cards",
        description:
          "A community registry of serialised Yu-Gi-Oh! cards and confirmed Grand Master Rare pulls.",
        isPartOf: {
          "@type": "WebSite",
          name: "TCG Serial Tracker",
          url: "https://www.tcgserialtracker.com",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <main>
      <PublicHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="simple-hero">
        <p className="eyebrow">Yu-Gi-Oh! collector registry</p>
        <h1>Serialised Yu-Gi-Oh! cards</h1>
        <p>
          Track confirmed Grand Master Rare pulls by card, serial number and
          region. The registry preserves a public record of numbered Yu-Gi-Oh!
          cards discovered by collectors worldwide.
        </p>
      </section>

      <section className="legal-content">
        <h2>Yu-Gi-Oh! serial number tracker</h2>
        <p>
          TCG Serial Tracker records individually numbered Yu-Gi-Oh! cards—also
          commonly searched as serialized Yu-Gi-Oh! cards. Each confirmed entry
          can include its evidence photograph, region, country and original
          public source.
        </p>

        <h2>Magnificent Monsters Grand Master Rares</h2>
        <p>
          Magnificent Monsters introduced 18 Grand Master Rare cards. Each card
          has 200 serial numbers across the Americas and European distributions,
          for 3,600 individually numbered cards in the complete registry.
        </p>
        <p>
          <Link href="/sets/magnificent-monsters">
            Browse the complete Magnificent Monsters registry
          </Link>
        </p>

        <h2>Confirmed serialised card pulls</h2>
        <p>
          Every public confirmation is linked to a particular card and serial
          number. This helps collectors see which copies have surfaced without
          claiming that cards not yet recorded remain unopened.
        </p>
        <p>
          <Link href="/gallery">View confirmed pulls in the Pull Gallery</Link>
        </p>

        <h2>Frequently asked questions</h2>
        {faqs.map((faq) => (
          <div key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}

        <h2>Register a Yu-Gi-Oh! serial number</h2>
        <p>
          Found a Grand Master Rare? Submit a clear photograph showing the card
          and its serial number for review before it is added to the registry.
        </p>
        <p><Link href="/submit">Submit a pull</Link></p>
      </section>
    </main>
  );
}
