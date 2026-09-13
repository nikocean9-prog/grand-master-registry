import SerializedSetPage from "../../components/SerializedSetPage";

export const dynamic = "force-dynamic";
export const metadata = { title: "LOTR Special Edition Serialized Registry | TCG Serial Tracker" };

export default function LotrSpecialEditionPage() {
  return <SerializedSetPage slug="lotr-special-edition" tcgName="Magic: The Gathering" eyebrow="Magic: The Gathering · The Lord of the Rings" title="Holiday Release" description="Track the serialized Borderless Poster cards and Realms and Relics box toppers from the holiday release, each numbered to 100." backHref="/tcg/magic-the-gathering" />;
}
