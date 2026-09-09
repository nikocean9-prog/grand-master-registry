import { notFound } from "next/navigation";
import Link from "next/link";
import PublicHeader from "../../components/PublicHeader";
import { getWikiArticle, wikiArticles } from "../../lib/wikiArticles";

export function generateStaticParams() {
  return wikiArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = getWikiArticle(slug);
  return article ? { title: `${article.title} | TCG Serial Tracker`, description: article.summary } : {};
}

export default async function WikiArticlePage({ params }) {
  const { slug } = await params;
  const article = getWikiArticle(slug);
  if (!article) notFound();

  return (
    <main className="wiki-page">
      <PublicHeader />
      <Link href="/wiki" className="back-link">← Wiki &amp; Articles</Link>
      <article className="wiki-article">
        <header>
          <p className="home-section-eyebrow">{article.category}</p>
          <h1>{article.title}</h1>
          <p>{article.summary}</p>
        </header>
        <div className="wiki-article-hero"><img src={article.image} alt={article.title} /></div>
        <div className="wiki-article-body">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
