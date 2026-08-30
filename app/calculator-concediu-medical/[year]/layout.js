// FIX (audit 2026-08-11): see app/calculator-pfa/[year]/layout.js for the full explanation —
// same two bugs here: year hardcoded to 2025, canonical inherited '/' from root layout.
export async function generateMetadata({ params }) {
  const { year } = params;
  const title = `Calculator Concediu Medical ${year} - Indemnizație Netă`;
  const description = `Calculează indemnizația pentru concediu medical în ${year} conform OUG 158/2005. Include toate codurile de indemnizație.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/calculator-concediu-medical/${year}`,
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default function Layout({ children }) {
  return <>{children}</>;
}
