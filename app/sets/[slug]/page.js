import { notFound } from "next/navigation";
import SerializedSetPage from "../../components/SerializedSetPage";
import { getSet } from "../../lib/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const set = getSet(slug);
  if (!set || set.status !== "live") return {};
  const title = `${set.name} Serialized Card List & Registry`;
  const description = `${set.description || set.summary} Browse every serialized ${set.name} card and track confirmed pulls.`;
  return {
    title,
    description,
    alternates: { canonical: `/sets/${set.slug}` },
    openGraph: { title, description, url: `/sets/${set.slug}` },
  };
}

export default async function SerializedRegistryPage({ params }) {
  const { slug } = await params;
  const set = getSet(slug);
  if (!set || set.status !== "live") notFound();

  return (
    <SerializedSetPage
      slug={set.slug}
      tcgName={set.tcg.name}
      eyebrow={`${set.tcg.name} · ${set.name}`}
      title={set.name}
      description={set.description || set.summary}
      backHref={`/tcg/${set.tcg.slug}`}
    />
  );
}
