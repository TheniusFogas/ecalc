const currentYear = new Date().getFullYear();

export async function generateMetadata({ params }) {
  const { year, path } = params;

  // Parse sum and type from path if it exists (e.g., "4500-brut-...")
  let amount = null;
  let isNetToBrut = false;

  if (path) {
    const matches = path.match(/^(\d+)/);
    if (matches) amount = matches[1];
    if (path.includes('net-brut')) isNetToBrut = true;
  }

  const displayTitle = amount
    ? `Calcul Salariu ${isNetToBrut ? 'Brut pentru ' + amount + ' Net' : 'Net pentru ' + amount + ' Brut'} - ${year}`
    : `Calculator Salariu ${year} - Brut la Net • Taxe & Deduceri 2026`;

  const displayDesc = amount
    ? `Calcul precis pentru salariul de ${amount} RON (${isNetToBrut ? 'Net' : 'Brut'}) în anul ${year}. Vezi taxele CAS, CASS, Impozit și deducerile personale în sectorul Standard, IT sau Construcții.`
    : `Calculează rapid salariul net în ${year} conform Codului Fiscal actualizat. Include deduceri personale, tichete de masă și facilități fiscale pentru sectoarele IT, Construcții și Agricultură.`;

  return {
    title: displayTitle,
    description: displayDesc,
    keywords: amount
      ? `calcul salariu ${amount} lei, salariu net ${amount} lei, taxe salariu ${amount} lei, salariu ${year}, ${isNetToBrut ? 'net brut' : 'brut net'}`
      : `calculator salarii ${year}, calcul salariu net ${year}, brut la net ${year}, deducere personala ${year}, salariu minim 2026, taxe salarii romania, calcul fluturas salariu`,
    alternates: {
      canonical: path ? `/calculator-salarii-pro/${year}/${path}` : `/calculator-salarii-pro/${year}`
    },
    openGraph: {
      title: displayTitle,
      description: displayDesc,
      url: `https://ecalc.ro/calculator-salarii-pro/${year}${path ? '/' + path : ''}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description: displayDesc,
    }
  };
}

export default function Layout({ children }) {
  return <>{children}</>;
}
