export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/submit"],
    },
    sitemap: "https://www.tcgserialtracker.com/sitemap.xml",
  };
}
