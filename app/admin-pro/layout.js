// FIX (audit 2026-08-11): the admin panel had no metadata of its own, so it inherited the
// public site's SEO metadata (title, description, indexable) — which is exactly what let it
// show up in Google search results. This forces a hard `noindex, nofollow` regardless of
// robots.txt, so even a stray inbound link can't get it re-indexed.
export const metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminProLayout({ children }) {
  return children;
}
