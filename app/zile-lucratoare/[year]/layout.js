// FIX (audit 2026-08-11): this route had no layout.js at all, so it inherited 100% of its
// metadata from the root layout — including `canonical: '/'`, meaning Google was told this
// page is a duplicate of the homepage, and the title shown in search results was the generic
// site-wide default, not "Zile Lucrătoare {year}".
export async function generateMetadata({ params }) {
  const { year } = params;
  const title = `Zile Lucrătoare ${year} - Calendar & Calculator`;
  const description = `Câte zile lucrătoare sunt în ${year}? Calendar complet cu zile lucrătoare, weekenduri și sărbători legale pentru ${year}.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/zile-lucratoare/${year}`,
    },
    openGraph: { title, description, type: 'website' },
  };
}

export default function Layout({ children }) {
  return <>{children}</>;
}
