import AdminOnlySetPage from "../../components/AdminOnlySetPage";

export const metadata = {
  title: "Magnificent Maestros Sneak Peek | TCG Serial Tracker",
  description: "Preview the 18 Grand Master Rare cards coming in Yu-Gi-Oh! Magnificent Maestros.",
};

export default function MagnificentMaestrosPage() {
  return <AdminOnlySetPage slug="magnificent-maestros" name="Magnificent Maestros" releaseDate="12 November 2026" />;
}
