import "./globals.css";
import Link from "next/link";
import AdminRegistryLink from "./components/AdminRegistryLink";
import TrafficTracker from "./components/TrafficTracker";

export const metadata = {
  metadataBase: new URL("https://www.tcgserialtracker.com"),
  title: "Serialized Card Registry | TCG Serial Tracker",
  description:
    "A global community registry for tracking and preserving serial-numbered trading cards.",
  openGraph: {
    title: "TCG Serial Tracker",
    description:
      "Tracking every serial. Preserving every pull.",
    url: "/",
    siteName: "TCG Serial Tracker",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TCG Serial Tracker — Tracking every serial. Preserving every pull.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TCG Serial Tracker",
    description: "Tracking every serial. Preserving every pull.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TrafficTracker />
        <div className="site-shell">
          <div className="site-content">{children}</div>
          <footer className="site-footer">
            <p>
              TCG Serial Tracker is an independent, unofficial registry and is not affiliated with,
              endorsed by, or sponsored by any trading card game publisher or rights holder.
              All game names, card names, logos, artwork and images belong to their respective owners.
              {" "}<Link href="/disclaimer">Disclaimer &amp; intellectual property</Link>
            </p>
            <div className="footer-admin"><AdminRegistryLink className="footer-admin-link" /></div>
          </footer>
        </div>
      </body>
    </html>
  );
}
