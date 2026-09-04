import "./globals.css";

export const metadata = {
  title: "Grand Master Registry",
  description: "Track Magnificent Monsters Grand Master Rare pulls",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <div className="site-content">{children}</div>
          <footer className="site-footer">
            <p>
              Grand Master Registry is an independent, unofficial fan project
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
