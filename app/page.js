import Link from "next/link";
import PublicHeader from "./components/PublicHeader";
import TcgCatalog from "./components/TcgCatalog";
import { tcgs } from "./lib/catalog";

export default function Home() {
  const liveSets = tcgs.flatMap((tcg) => tcg.sets).filter((set) => set.status === "live");

  return (
    <main>
      <PublicHeader />
      <section className="home-hero">
        <div>
        <p className="eyebrow">The global serialised card registry</p>
        <h1>Tracking every serial. Preserving every pull.</h1>
        <p className="hero-copy">
          Explore community-built registries for serial-numbered trading cards,
          organised by trading card game and set.
        </p>
        <div className="hero-actions"><Link href="#tcgs" className="hero-button hero-button-primary">Browse TCGs</Link><Link href="/submit" className="hero-button hero-button-secondary">Submit a Pull</Link></div>
        </div>
        <div className="home-stats" aria-label="Registry overview"><div><strong>1</strong><span>Live TCG</span></div><div><strong>{liveSets.length}</strong><span>Live set</span></div><div><strong>3,600</strong><span>Serials tracked</span></div></div>
      </section>
      <section className="registry-section" id="tcgs">
        <div className="section-heading">
          <div><p className="eyebrow">Explore the registry</p><h2>Choose a TCG</h2></div><p>Select a game, then choose the set you want to explore.</p>
        </div>
        <TcgCatalog tcgs={tcgs} />
      </section>
      <section className="home-links"><Link href="/help" className="feature-link"><span>?</span><div><h2>Help &amp; Contact</h2><p>Get help, report a problem, or suggest a TCG or set.</p></div></Link><Link href="/store" className="feature-link"><span>◇</span><div><h2>Store</h2><p>A future home for TCG Serial Tracker products.</p></div><small>Coming soon</small></Link></section>
    </main>
  );
}
