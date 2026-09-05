import Link from "next/link";
import { notFound } from "next/navigation";
import PublicHeader from "../../components/PublicHeader";
import AdminOnlyTcgPage from "../../components/AdminOnlyTcgPage";
import TcgSetDirectory from "../../components/TcgSetDirectory";
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
        <TcgSetDirectory sets={tcg.sets} />
      </section>
    </main>
  );
}
