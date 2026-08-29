import type { MetadataRoute } from 'next'
import { events } from '@/lib/tickets'
export default function sitemap():MetadataRoute.Sitemap{const base='https://asorta.nl';const routes=['','/events','/sell','/organizers','/pricing','/account','/login','/register','/about','/contact','/faq','/privacy','/terms'];return [...routes.map(route=>({url:`${base}${route}`,lastModified:new Date()})),...events.map(event=>({url:`${base}/events/${event.slug}`,lastModified:new Date()}))]}
