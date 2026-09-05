import AdminOnlySetPage from "../../components/AdminOnlySetPage";

export const metadata = {
  title: "Magnificent Maestros Admin Preview | TCG Serial Tracker",
  robots: { index: false, follow: false },
};

export default function MagnificentMaestrosPage() {
  return <AdminOnlySetPage slug="magnificent-maestros" name="Magnificent Maestros" releaseDate="12 November 2026" />;
}
