import Link from "next/link";
import { notFound } from "next/navigation";
import PublicHeader from "../../components/PublicHeader";
import AdminOnlyTcgPage from "../../components/AdminOnlyTcgPage";
import { getTcg, tcgs } from "../../lib/catalog";

export function generateStaticParams() { return tcgs.map((tcg) => ({ slug: tcg.slug })); }

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tcg = getTcg(slug);
  return tcg ? { title: `${tcg.name} | TCG Serial Tracker`, description: tcg.description } : {};
}

export default async function TcgPage({ params }) {
  const { slug } = await params;
  const tcg = getTcg(slug);
  if (!tcg) notFound();
  const hasLiveSet = tcg.sets.some((set) => set.status === "live");
  if (!hasLiveSet) return <AdminOnlyTcgPage tcg={tcg} />;
  return (
    <main><PublicHeader /><Link href="/#tcgs" className="back-link">← All TCGs</Link>
      <section className="catalog-heading"><span className="tcg-monogram large" aria-hidden="true">{tcg.initials}</span><div><p className="eyebrow">Trading card game</p><h1>{tcg.name}</h1><p>{tcg.description}</p></div></section>
      <section className="registry-section"><div className="section-heading"><div><p className="eyebrow">Set directory</p><h2>Choose a set</h2></div></div>
        {tcg.sets.length ? <div className="set-list">{tcg.sets.map((set) => set.href ?
          <Link href={set.href} className="set-card" key={set.name}><div><span className="status-badge live">Live</span><h3>{set.name}</h3><p>{set.summary}</p></div><strong>Open registry →</strong></Link> :
          <div className="set-card muted" key={set.name}><div><span className="status-badge planned">Planned</span><h3>{set.name}</h3></div><strong>Coming soon</strong></div>)}</div> :
          <div className="empty-state"><h3>No sets are live yet</h3><p>This TCG is in the future expansion plan.</p><Link href="/help#contact" className="hero-button hero-button-primary">Suggest a set</Link></div>}
      </section>
    </main>
  );
}
