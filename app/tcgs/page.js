import PublicHeader from "../components/PublicHeader";
import TcgCatalog from "../components/TcgCatalog";
import { tcgs } from "../lib/catalog";

export const metadata = {
  title: "Trading Card Games | TCG Serial Tracker",
  description: "Browse live and upcoming serialised trading card registries.",
};

export default function TcgsPage() {
  return (
    <main>
      <PublicHeader />
      <section className="registry-section">
        <div className="section-heading">
          <div><p className="eyebrow">Available now</p><h2>Live registries</h2></div>
        </div>
        <TcgCatalog tcgs={tcgs} />
      </section>
    </main>
  );
}
