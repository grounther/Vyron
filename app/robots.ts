import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/google/merchant-feed', '/api/google/products.xml'],
        disallow: ['/atlas', '/atlas-access', '/atlas/', '/api/atlas/', '/api/cron/', '/api/recovery/'],
      },
    ],
    sitemap: 'https://asorta.nl/sitemap.xml',
  }
}
