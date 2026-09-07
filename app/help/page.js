import Link from "next/link";
import PublicHeader from "../components/PublicHeader";

export const metadata = { title: "Help & Contact | TCG Serial Tracker" };

export default function HelpPage() {
  return (
    <main><PublicHeader /><section className="simple-hero"><p className="eyebrow">Support</p><h1>Help &amp; Contact</h1><p>Answers for collectors using or contributing to TCG Serial Tracker.</p></section>
      <section className="help-grid">
        <article><h2>How do I submit a pull?</h2><p>Open Submit a Pull, choose the card and serial, and add your evidence. Submissions are reviewed before becoming confirmed.</p><Link href="/submit">Submit a Pull →</Link></article>
        <article><h2>Can I challenge a record?</h2><p>Yes. Submit the same serial with new evidence. Your email is required for a challenge so an administrator can contact you if more information is needed.</p></article>
        <article><h2>Why is my submission pending?</h2><p>Every submission is checked by an administrator. It will appear in the public registry only after it has been approved.</p></article>
        <article><h2>Can I suggest another TCG or set?</h2><p>Yes. If we have missed a TCG or serialised set you would like us to add, let us know.</p></article>
      </section>
      <section className="contact-panel" id="contact"><p className="eyebrow">Contact us</p><h2>Need more help?</h2><p>If we have missed a TCG or serialised set you would like us to add, or you need help with the registry, send us an email.</p><a href="mailto:contact@tcgserialtracker.com?subject=TCG%20Serial%20Tracker%20enquiry" className="hero-button hero-button-primary">Email us</a></section>
    </main>
  );
}
