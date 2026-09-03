import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const legacyPublicRoutes = new Map<string,string>([
  ['/card-scanner','/homes'],
  ['/cart','/homes'],
  ['/category','/homes'],
  ['/checkout','/'],
  ['/events','/homes'],
  ['/market','/homes'],
  ['/okfashion','/homes'],
  ['/orders','/account'],
  ['/organizer','/'],
  ['/organizers','/'],
  ['/product','/homes'],
  ['/resale','/'],
  ['/returns','/terms'],
  ['/search','/homes'],
  ['/sell','/place-home'],
  ['/shipping','/terms'],
  ['/shop','/homes'],
  ['/tcg','/homes'],
  ['/track-order','/account'],
  ['/validate','/'],
])

const legacyAtlasRoutes = new Map<string,string>([
  ['/atlas/bookkeeping','/atlas'],
  ['/atlas/integrations','/atlas/payments'],
  ['/atlas/newsletter','/atlas'],
  ['/atlas/orders','/atlas'],
  ['/atlas/organizers','/atlas'],
  ['/atlas/pages','/atlas'],
  ['/atlas/pricing','/atlas'],
  ['/atlas/products','/atlas'],
  ['/atlas/promotions','/atlas'],
  ['/atlas/recovery','/atlas'],
  ['/atlas/seo','/atlas'],
])

const retiredApiRoutes = [
  '/api/account/tcg',
  '/api/account/wishlist',
  '/api/admin/shopify',
  '/api/atlas/bookkeeping',
  '/api/card-scanner',
  '/api/cart',
  '/api/checkout',
  '/api/cj',
  '/api/cron/orders-cleanup',
  '/api/cron/shopify-sync',
  '/api/google',
  '/api/mollie/callback',
  '/api/newsletter',
  '/api/orders',
  '/api/organizer',
  '/api/paypal',
  '/api/recovery',
  '/api/webhooks/cj',
  '/api/webhooks/payment',
  '/api/webhooks/shopify',
  '/api/withdrawal',
]

function matchesPath(pathname:string,prefix:string){return pathname===prefix||pathname.startsWith(`${prefix}/`)}

export async function proxy(request: NextRequest) {
  const pathname=request.nextUrl.pathname
  for(const[prefix,destination]of legacyPublicRoutes)if(matchesPath(pathname,prefix)){
    const url=request.nextUrl.clone();url.pathname=destination;url.search='';return NextResponse.redirect(url,308)
  }
  for(const[prefix,destination]of legacyAtlasRoutes)if(matchesPath(pathname,prefix)){
    const url=request.nextUrl.clone();url.pathname=destination;url.search='';return NextResponse.redirect(url,308)
  }
  if(retiredApiRoutes.some(prefix=>matchesPath(pathname,prefix)))return NextResponse.json({error:'Deze oude ASORTA-functie is niet meer beschikbaar.'},{status:410})
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
