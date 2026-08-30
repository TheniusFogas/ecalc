// FIX (audit 2026-08-11): see app/calculator-pfa/[year]/layout.js for the full explanation —
// same two bugs here: year hardcoded to 2025, canonical inherited '/' from root layout.
export async function generateMetadata({ params }) {
  const { year } = params;
  const title = `Calculator Compensații Zboruri Întârziate/Anulate ${year}`;
  const description = `Calculează compensația pentru zboruri întârziate sau anulate în ${year}, conform Regulamentului UE 261/2004.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/calculator-compensatii-zboruri/${year}`,
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default function Layout({ children }) {
  return <>{children}</>;
}
