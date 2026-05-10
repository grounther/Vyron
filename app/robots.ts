import type { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/atlas','/atlas-access','/atlas/'] }], sitemap: 'https://asorta.nl/sitemap.xml' }
}
