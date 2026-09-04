import Link from "next/link";
import PublicHeader from "../components/PublicHeader";

export const metadata = { title: "Store | TCG Serial Tracker" };

export default function StorePage() {
  return <main><PublicHeader /><section className="empty-state store-state"><span className="store-icon">◇</span><p className="eyebrow">Future feature</p><h1>TCG Serial Tracker Store</h1><p>The store is reserved for a future stage of the project. There are no products or payments available yet.</p><Link href="/" className="hero-button hero-button-primary">Back to home</Link></section></main>;
}
