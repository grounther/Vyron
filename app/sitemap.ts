import type { MetadataRoute } from 'next'
import { products, categories } from '@/lib/products'
export default function sitemap(): MetadataRoute.Sitemap {
  const base='https://asorta.nl'
  const staticRoutes=['','/shop','/account','/login','/register','/shipping','/returns','/contact','/faq','/privacy','/terms'].map(route=>({url:`${base}${route}`,lastModified:new Date()}))
  const productRoutes=products.map(p=>({url:`${base}/product/${p.slug}`,lastModified:new Date()}))
  const categoryRoutes=categories.map(c=>({url:`${base}/category/${c.slug}`,lastModified:new Date()}))
  return [...staticRoutes,...categoryRoutes,...productRoutes]
}
