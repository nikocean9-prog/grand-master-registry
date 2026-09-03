import "./globals.css";

export const metadata = {
  title: "Grand Master Registry",
  description: "Track Magnificent Monsters Grand Master Rare pulls",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
