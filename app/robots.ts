import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin-pro/',
    },
    // URL oficial Sitemap
    sitemap: 'https://ecalc.ro/sitemap.xml',
  }
}
