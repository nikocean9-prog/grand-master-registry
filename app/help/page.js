import Link from "next/link";
import PublicHeader from "../components/PublicHeader";

export const metadata = { title: "Help & Contact | TCG Serial Tracker" };

export default function HelpPage() {
  return (
    <main><PublicHeader /><section className="simple-hero"><p className="eyebrow">Support</p><h1>Help &amp; Contact</h1><p>Answers for collectors using or contributing to TCG Serial Tracker.</p></section>
      <section className="help-grid">
        <article><h2>How do I submit a pull?</h2><p>Open Submit a Pull, choose the card and serial, and add your evidence. Submissions are reviewed before becoming confirmed.</p><Link href="/submit">Submit a Pull →</Link></article>
        <article><h2>Can I challenge a record?</h2><p>Yes. Submit the same serial with new evidence. Your email is required for a challenge so an administrator can contact you if more information is needed.</p></article>
        <article><h2>Why is my submission pending?</h2><p>Every submission is checked by an administrator. Pending serials are shown as awaiting verification until that review is complete.</p></article>
        <article><h2>Can I suggest another TCG or set?</h2><p>Yes. The registry is designed to expand beyond its first Yu-Gi-Oh! set.</p></article>
      </section>
      <section className="contact-panel" id="contact"><p className="eyebrow">Contact us</p><h2>Need more help?</h2><p>For now, include your email with your submission so the review team can reply. A dedicated public contact form will be added here next.</p><Link href="/submit" className="hero-button hero-button-primary">Go to submissions</Link></section>
    </main>
  );
}
