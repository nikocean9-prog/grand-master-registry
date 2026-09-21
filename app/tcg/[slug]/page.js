import Link from "next/link";
import { notFound } from "next/navigation";
import PublicHeader from "../../components/PublicHeader";
import TcgSetDirectory from "../../components/TcgSetDirectory";
import { getTcg, tcgs } from "../../lib/catalog";
import { TCG_HEADER_LOGOS, MAGIC_STYLE_TCGS } from "../../lib/setWordmarks";

export function generateStaticParams() { return tcgs.map((tcg) => ({ slug: tcg.slug })); }

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tcg = getTcg(slug);
  if (!tcg) return {};
  const title = `${tcg.name} Serialized Card Registry`;
  const description = `Browse serialized ${tcg.name} card sets, card lists and confirmed serial-numbered pulls in the TCG Serial Tracker registry.`;
  return {
    title,
    description,
    alternates: { canonical: `/tcg/${tcg.slug}` },
    openGraph: { title, description, url: `/tcg/${tcg.slug}` },
  };
}

export default async function TcgPage({ params }) {
  const { slug } = await params;
  const tcg = getTcg(slug);
  if (!tcg) notFound();
  const hasLiveSet = tcg.sets.some((set) => set.status === "live");
  if (!hasLiveSet) {
    return (
      <main><PublicHeader /><Link href="/tcgs" className="back-link">← All TCGs</Link>
        <section className="catalog-heading planned-tcg-heading">
          <span className="planned-tcg-wordmark" aria-hidden="true"><img src={tcg.logo} alt="" /></span>
          <div><p className="eyebrow">Coming soon</p><h1>{tcg.name}</h1><p>{tcg.description}</p></div>
        </section>
        <section className="registry-section">
          <div className="empty-state"><h2>Registry in preparation</h2><p>This TCG will become available as verified serialised-card data is added.</p></div>
        </section>
      </main>
    );
  }
  const headerLogo = TCG_HEADER_LOGOS[tcg.slug];
  return (
    <main><PublicHeader /><Link href="/tcgs" className="back-link">← All TCGs</Link>
      <section className={`catalog-heading tcg-heading-${tcg.slug}${MAGIC_STYLE_TCGS.includes(tcg.slug) ? " tcg-heading-magic-the-gathering" : ""}`}><div><p className="eyebrow">Trading card game</p><h1>{headerLogo ? <img className="tcg-official-logo" src={headerLogo} alt={tcg.name} /> : tcg.name}</h1><p>{tcg.description}</p></div></section>
      <section className="registry-section"><div className="section-heading"><div><p className="eyebrow">Set directory</p><h2>Choose a set</h2></div></div>
        <TcgSetDirectory sets={tcg.sets} tcgSlug={tcg.slug} />
      </section>
    </main>
  );
}
