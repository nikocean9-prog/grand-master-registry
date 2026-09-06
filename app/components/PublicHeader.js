import Link from "next/link";

export default function PublicHeader() {
  return (
    <nav className="public-nav" aria-label="Main navigation">
      <Link href="/" className="site-name" aria-label="TCG Serial Tracker home">
        <img src="/tst-mark.svg" alt="" width="46" height="46" className="brand-mark" />
        <span className="brand-copy">
          <strong><span>TCG</span> Serial Tracker</strong>
          <small>The global serialised card registry</small>
        </span>
      </Link>
      <div className="nav-actions">
        <Link href="/submit" className="nav-link nav-link-primary">Submit a Pull</Link>
      </div>
    </nav>
  );
}
