// FIX (audit 2026-08-11): see app/calculator-pfa/[year]/layout.js for the full explanation —
// same two bugs here: year hardcoded to 2025, canonical inherited '/' from root layout.
export async function generateMetadata({ params }) {
  const { year } = params;
  const title = `Calculator Impozit Auto ${year} - Toate Localitățile`;
  const description = `Calculați impozitul auto anual pentru orice vehicul în ${year}. Include taxe pentru hibride, electrice și motoare mari.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/calculator-impozit-auto/${year}`,
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default function Layout({ children }) {
  return <>{children}</>;
}
