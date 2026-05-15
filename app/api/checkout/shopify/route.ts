import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createShopifyCheckoutRedirect } from '@/lib/shopify/checkout'
import { hasShopifyAdminConfig, getShopifyConfig } from '@/lib/shopify/client'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { storeDomain } = getShopifyConfig()

    if (!storeDomain) {
      return NextResponse.json({ error: 'SHOPIFY_STORE_DOMAIN ontbreekt.' }, { status: 400 })
    }

    // Admin/client-credentials config is not required for the actual cart permalink,
    // but this warning helps catch incomplete installs before customers hit checkout.
    const hasAdmin = hasShopifyAdminConfig()
    const admin = createAdminClient()
    const result = await createShopifyCheckoutRedirect({
      items: body.items,
      email: body.email || body.shipping?.email,
      client: admin,
    })

    return NextResponse.json({
      ok: true,
      provider: 'shopify_paypal',
      checkoutUrl: result.checkoutUrl,
      lineCount: result.lineCount,
      itemCount: result.itemCount,
      warning: hasAdmin ? null : 'Shopify Admin credentials ontbreken; checkout gebruikt bestaande Shopify variant IDs uit Supabase.',
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Shopify checkout kon niet worden gestart.' }, { status: 500 })
  }
}
