import SerializedSetPage from "../../components/SerializedSetPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "MTG FINAL FANTASY Serialized Registry | TCG Serial Tracker" };

export default function FinalFantasyPage() {
  return <SerializedSetPage slug="mtg-final-fantasy" tcgName="Magic: The Gathering" eyebrow="Magic: The Gathering · FINAL FANTASY" title="FINAL FANTASY" description="Track the 77 individually numbered Golden Traveling Chocobo cards." backHref="/tcg/magic-the-gathering" />;
}
