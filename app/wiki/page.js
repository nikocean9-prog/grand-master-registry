import Link from "next/link";
import PublicHeader from "../components/PublicHeader";
import { wikiArticles } from "../lib/wikiArticles";

export const metadata = {
  title: "Wiki & Articles | TCG Serial Tracker",
  description: "Profiles, histories and guides covering prominent serialized cards and trading-card characters.",
};

export default function WikiPage() {
  return (
    <main className="wiki-page">
      <PublicHeader />
      <header className="wiki-heading">
        <p className="home-section-eyebrow">Learn from the registry</p>
        <h1>Wiki &amp; Articles</h1>
        <p>Character profiles, notable cards, collecting history and guides to serialized releases.</p>
      </header>

      <div className="wiki-grid">
        {wikiArticles.map((article) => (
          <Link href={`/wiki/${article.slug}`} className="wiki-card" key={article.slug}>
            <span className="wiki-card-image"><img src={article.image} alt="" /></span>
            <span className="wiki-card-copy">
              <small>{article.category}</small>
              <strong>{article.title}</strong>
              <span>{article.summary}</span>
              <b>Read article</b>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
