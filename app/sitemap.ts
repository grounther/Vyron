import type { MetadataRoute } from 'next'
import { categories } from '@/lib/products'
import { getProducts } from '@/lib/catalog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base='https://asorta.nl'
  const staticRoutes=['','/shop','/account','/login','/register','/shipping','/returns','/contact','/faq','/privacy','/terms'].map(route=>({url:`${base}${route}`,lastModified:new Date(),changeFrequency:'weekly' as const,priority:route===''?1:0.7}))
  const products = await getProducts()
  const productRoutes=products.map(p=>({url:`${base}/product/${p.slug}`,lastModified:new Date(),changeFrequency:'daily' as const,priority:0.9}))
  const categoryRoutes=categories.map(c=>({url:`${base}/category/${c.slug}`,lastModified:new Date(),changeFrequency:'weekly' as const,priority:0.8}))
  return [...staticRoutes,...categoryRoutes,...productRoutes]
}
