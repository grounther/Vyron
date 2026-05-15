import type { MetadataRoute } from 'next'
import { categories } from '@/lib/products'
import { getProducts } from '@/lib/catalog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base='https://asorta.nl'
  const staticRoutes=['','/shop','/account','/login','/register','/shipping','/returns','/contact','/faq','/privacy','/terms'].map(route=>({url:`${base}${route}`,lastModified:new Date()}))
  const products = await getProducts()
  const productRoutes=products.map(p=>({url:`${base}/product/${p.slug}`,lastModified:new Date()}))
  const categoryRoutes=categories.map(c=>({url:`${base}/category/${c.slug}`,lastModified:new Date()}))
  return [...staticRoutes,...categoryRoutes,...productRoutes]
}
