import SerializedSetPage from "../../components/SerializedSetPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "LOTR Original Serialized Registry | TCG Serial Tracker" };

export default function LotrOriginalPage() {
  return <SerializedSetPage slug="lotr-original" tcgName="Magic: The Gathering" eyebrow="Magic: The Gathering · The Lord of the Rings" title="The Lord of the Rings: Tales of Middle-earth" description="Track The One Ring and the three serialized Sol Ring variants." backHref="/tcg/magic-the-gathering" />;
}
