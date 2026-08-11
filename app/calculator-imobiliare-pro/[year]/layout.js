// FIX (audit 2026-08-11): see app/calculator-pfa/[year]/layout.js for the full explanation —
// same two bugs here: year hardcoded to 2025, canonical inherited '/' from root layout.
export async function generateMetadata({ params }) {
  const { year } = params;
  const title = `Calculator Rentabilitate Imobiliară Pro ${year}`;
  const description = `Analiză completă a investițiilor imobiliare în ${year}: randament, credit ipotecar, cash-on-cash și perioada de recuperare.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/calculator-imobiliare-pro/${year}`,
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default function Layout({ children }) {
  return <>{children}</>;
}
