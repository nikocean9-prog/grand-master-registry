import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://www.tcgserialtracker.com"),
  title: "TCG Serial Tracker",
  description:
    "A global community registry for tracking and preserving serial-numbered trading cards.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TCG Serial Tracker",
    description:
      "Tracking every serial. Preserving every pull.",
    url: "/",
    siteName: "TCG Serial Tracker",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <div className="site-content">{children}</div>
          <footer className="site-footer">
            <p>
              TCG Serial Tracker is an independent, unofficial fan project
              and is not affiliated with, endorsed by, or sponsored by Konami
              Digital Entertainment.
            </p>
            <p>
              Yu-Gi-Oh! and related card names, artwork and images belong to
              their respective trademark and copyright owners. Card images are
              displayed for identification and registry purposes.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
