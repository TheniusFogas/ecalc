// FIX (audit 2026-08-11): see app/calculator-pfa/[year]/layout.js for the full explanation —
// same two bugs here: year hardcoded to 2025, canonical inherited '/' from root layout.
export async function generateMetadata({ params }) {
  const { year } = params;
  const title = `Calculator e-Factura Termene ANAF ${year}`;
  const description = `Verifică termenele limită pentru transmiterea facturilor în sistemul RO e-Factura în ${year} ca să eviți amenzile ANAF.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/calculator-efactura/${year}`,
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default function Layout({ children }) {
  return <>{children}</>;
}
