import SerializedSetPage from "../../components/SerializedSetPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "LOTR Original Serialized Registry | TCG Serial Tracker" };

export default function LotrOriginalPage() {
  return <SerializedSetPage slug="lotr-original" tcgName="Magic: The Gathering" eyebrow="Magic: The Gathering · The Lord of the Rings" title="Original Serialized Release" description="Track The One Ring and the three serialized Sol Ring variants from the original release." backHref="/tcg/magic-the-gathering" />;
}
