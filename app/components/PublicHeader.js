import Link from "next/link";

export default function PublicHeader({ showSubmit = true }) {
  return (
    <nav className="public-nav" aria-label="Main navigation">
      <details className="public-menu">
        <summary className="public-menu-trigger" aria-label="Open navigation menu">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </summary>
        <div className="public-menu-panel">
          <Link href="/">Home</Link>
          <Link href="/submit">Submit a Pull</Link>
          <Link href="/help">Help</Link>
          <Link href="/disclaimer">Legal &amp; disclaimer</Link>
        </div>
      </details>
      <Link href="/" className="site-name" aria-label="TCG Serial Tracker home">
        <img src="/tst-card-check-logo.png" alt="" width="46" height="46" className="brand-mark" />
        <span className="brand-copy"><small>TCG Serial</small><strong>Tracker</strong></span>
      </Link>
      {showSubmit && (
        <div className="nav-actions">
          <Link href="/submit" className="nav-link nav-link-primary">Submit a Pull</Link>
        </div>
      )}
    </nav>
  );
}
