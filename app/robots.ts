import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // FIX (audit 2026-08-11): the old rule was only '/admin-pro/' (trailing slash), which
      // in robots.txt prefix-matching does NOT cover the page itself at '/admin-pro' (no
      // trailing slash) — only sub-routes like '/admin-pro/sandbox'. That gap is why Google
      // indexed the live admin dashboard. Both forms are now blocked, plus the API routes
      // that back it. This keeps crawlers out; the page itself also now ships a `noindex`
      // meta tag (app/admin-pro/layout.js) and requires a real login server-side.
      disallow: ['/admin-pro', '/admin-pro/', '/api/'],
    },
    // URL oficial Sitemap
    sitemap: 'https://ecalc.ro/sitemap.xml',
  }
}
