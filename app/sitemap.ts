import type { MetadataRoute } from 'next'
import { categories, products } from '@/lib/products'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://asorta.nl'
  const staticRoutes = ['', '/shop', '/search', '/login', '/register', '/account', '/shipping', '/returns', '/contact', '/faq', '/privacy', '/terms'].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.7,
  }))
  const productRoutes = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))
  const categoryRoutes = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
  return [...staticRoutes, ...productRoutes, ...categoryRoutes]
}
