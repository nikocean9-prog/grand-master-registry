import Link from "next/link";
import AdminRegistryLink from "./AdminRegistryLink";

export default function PublicHeader() {
  return (
    <nav className="public-nav" aria-label="Main navigation">
      <Link href="/" className="site-name" aria-label="TCG Serial Tracker home">
        <img src="/tst-mark.svg" alt="" width="46" height="46" className="brand-mark" />
        <span className="brand-copy"><strong>TCG Serial Tracker</strong><small>Tracking every serial</small></span>
      </Link>
      <div className="nav-actions">
        <Link href="/#tcgs" className="nav-link nav-link-plain">Browse TCGs</Link>
        <Link href="/submit" className="nav-link nav-link-primary">Submit a Pull</Link>
        <AdminRegistryLink />
      </div>
    </nav>
  );
}
