// FIX (audit 2026-08-11): was `export const metadata` — a STATIC object with the year
// hardcoded to "2025", served identically for /2024, /2025 and /2026. It also had no
// `alternates.canonical` of its own, so it silently inherited `canonical: '/'` from the root
// layout — telling Google this page is a duplicate of the homepage. `generateMetadata` fixes
// both: the title now matches the real year in the URL, and the canonical is self-referencing.
export async function generateMetadata({ params }) {
  const { year } = params;
  const title = `Calculator PFA ${year} - Sisteme Net, CAS, CASS, Impozit`;
  const description = `Calculează rapid venitul net pentru PFA în ${year}, incluzând contribuțiile CAS, CASS și impozitul pe venit.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/calculator-pfa/${year}`,
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default function Layout({ children }) {
  return <>{children}</>;
}
