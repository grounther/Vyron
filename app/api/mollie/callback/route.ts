import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const order = url.searchParams.get('order') || ''
  const successUrl = new URL('/checkout/success', url.origin)
  successUrl.searchParams.set('payment', 'mollie')
  if (order) successUrl.searchParams.set('order', order)
  return NextResponse.redirect(successUrl)
}
