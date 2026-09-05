import Link from "next/link";
import PublicHeader from "./components/PublicHeader";
import TcgCatalog from "./components/TcgCatalog";
import { tcgs } from "./lib/catalog";

export default function Home() {
  const liveSets = tcgs.flatMap((tcg) => tcg.sets).filter((set) => set.status === "live");
  const liveTcgCount = tcgs.filter((tcg) => tcg.sets.some((set) => set.status === "live")).length;
  const serialCount = liveSets.reduce((total, set) => total + (set.serials || 0), 0);

  return (
    <main>
      <PublicHeader />
      <section className="compact-home-intro">
        <p className="eyebrow">The global serialised card registry</p>
        <h1>Find and track serialised cards</h1>
        <p>
          Explore community-built registries for serial-numbered trading cards,
          organised by trading card game and set.
        </p>
      </section>
      <section className="compact-stats" aria-label="Registry overview"><div><strong>{liveTcgCount}</strong><span>Live TCGs</span></div><div><strong>{liveSets.length}</strong><span>Live sets</span></div><div><strong>{serialCount.toLocaleString()}</strong><span>Serials</span></div></section>
      <section className="registry-section" id="tcgs">
        <div className="section-heading">
          <div><p className="eyebrow">Available now</p><h2>Live registries</h2></div>
        </div>
        <TcgCatalog tcgs={tcgs} />
      </section>
      <section className="home-links single"><Link href="/help" className="feature-link"><span>?</span><div><h2>Help &amp; Contact</h2><p>Get help, report a problem, or suggest a TCG or set.</p></div></Link></section>
    </main>
  );
}
