import type { MetadataRoute } from 'next'
export default function sitemap():MetadataRoute.Sitemap{const base='https://asorta.nl';const routes=['','/homes','/place-home','/search-profile','/matches','/pricing','/account','/login','/register','/about','/contact','/faq','/privacy','/terms','/herroepen'];return routes.map(route=>({url:`${base}${route}`,lastModified:new Date()}))}
