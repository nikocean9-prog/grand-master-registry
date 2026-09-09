import Link from "next/link";
import PublicHeader from "../components/PublicHeader";

export const metadata = {
  title: "Disclaimer & Intellectual Property | TCG Serial Tracker",
};

export default function DisclaimerPage() {
  return (
    <main>
      <PublicHeader />
      <section className="simple-hero">
        <p className="eyebrow">Site information</p>
        <h1>Disclaimer &amp; intellectual property</h1>
        <p>Information about the independent status and content of TCG Serial Tracker.</p>
      </section>

      <section className="legal-content">
        <h2>Independent registry</h2>
        <p>
          TCG Serial Tracker is an independent, unofficial, community-built registry. It is not
          affiliated with, endorsed by, authorised by, or sponsored by any trading card game
          publisher, manufacturer, distributor, artist, marketplace or other rights holder.
        </p>

        <h2>Trade marks and copyrighted material</h2>
        <p>
          Trading card game names, product and set names, card names, logos, symbols, artwork,
          card designs and images are the property of their respective trade mark and copyright
          owners. References to these materials are used to identify and document collectible cards.
        </p>

        <h2>Community submissions</h2>
        <p>
          Photographs and information may be supplied by collectors or obtained from referenced
          public sources. Inclusion in the registry does not establish ownership, authenticity,
          grading, value or approval by a rights holder. If you own rights in material displayed
          here and have a concern, please contact us so it can be reviewed.
        </p>

        <h2>No professional advice</h2>
        <p>
          Registry information and automated photo checks are provided for general identification
          and record-keeping only. They are not professional authentication, valuation, legal or
          financial advice. Users should verify important information independently.
        </p>

        <h2>Anonymous usage information</h2>
        <p>
          The site records anonymous page-view totals, approximate unique visitor counts and the
          pages visited so the registry can understand which areas are useful. It also assigns a
          private, one-way tracking code to submissions so the owner can distinguish public,
          owner and assisted uploads even when optional contact details are not provided. The
          submission identifier uses first-party browser storage; traffic counts use a one-way
          connection fingerprint. Raw IP addresses are not saved, no tracking code is placed
          visibly inside submitted photos, and these private identifiers are not displayed on the
          public registry.
        </p>

        <Link href="/" className="back-link">← Back to registry</Link>
      </section>
    </main>
  );
}
