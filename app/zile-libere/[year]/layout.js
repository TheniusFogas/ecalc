// FIX (audit 2026-08-11): same bug as app/zile-lucratoare/[year] — no layout.js meant no
// self-referencing canonical, so this page was silently telling Google it's a duplicate of
// the homepage.
export async function generateMetadata({ params }) {
  const { year } = params;
  const title = `Zile Libere ${year} - Sărbători Legale & Minivacanțe`;
  const description = `Toate zilele libere legale din ${year}: sărbători, punți și minivacanțe. Planifică-ți concediul din timp.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/zile-libere/${year}`,
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default function Layout({ children }) {
  return <>{children}</>;
}
