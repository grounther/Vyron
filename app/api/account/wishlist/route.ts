import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type WishlistAction = 'add' | 'remove' | 'toggle'

function normalizeProductSlug(value: unknown) {
  return String(value || '')
    .split('__')[0]
    .split('#')[0]
    .trim()
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

async function getAuthenticatedContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id || !user.email) {
    return { error: jsonError('Login required to manage wishlist.', 401) }
  }

  const admin = createAdminClient()
  if (!admin) {
    return { error: jsonError('Wishlist is tijdelijk niet beschikbaar.', 503) }
  }

  const email = user.email.toLowerCase().trim()

  const { data: customer, error: customerError } = await admin
    .from('customers')
    .upsert({ auth_user_id: user.id, email, updated_at: new Date().toISOString() }, { onConflict: 'email' })
    .select('id,email,auth_user_id')
    .maybeSingle()

  if (customerError || !customer?.id) {
    return { error: jsonError(customerError?.message || 'Customer profile could not be loaded.', 500) }
  }

  return { admin, user, customer }
}

export async function GET(request: Request) {
  const context = await getAuthenticatedContext()
  if ('error' in context) return context.error

  const url = new URL(request.url)
  const productSlug = normalizeProductSlug(url.searchParams.get('productSlug'))

  let query = context.admin
    .from('customer_wishlists')
    .select('id, product_slug, created_at')
    .eq('auth_user_id', context.user.id)
    .order('created_at', { ascending: false })

  if (productSlug) query = query.eq('product_slug', productSlug)

  const { data: rows, error } = await query
  if (error) return jsonError(error.message, 500)

  const slugs = Array.from(new Set((rows || []).map((row) => row.product_slug).filter(Boolean)))
  let productsBySlug = new Map<string, any>()

  if (slugs.length) {
    const { data: products } = await context.admin
      .from('products')
      .select('slug,name,category,price,compare_at,hero_image,short_description,status,shopify_product_id,shopify_variant_legacy_id')
      .in('slug', slugs)

    productsBySlug = new Map((products || []).map((product) => [product.slug, product]))
  }

  const items = (rows || []).map((row) => ({
    id: row.id,
    productSlug: row.product_slug,
    createdAt: row.created_at,
    product: productsBySlug.get(row.product_slug) || null,
  }))

  return NextResponse.json({
    ok: true,
    inWishlist: productSlug ? items.length > 0 : undefined,
    count: items.length,
    items,
  })
}

export async function POST(request: Request) {
  const context = await getAuthenticatedContext()
  if ('error' in context) return context.error

  let body: { productSlug?: string; action?: WishlistAction }
  try {
    body = await request.json()
  } catch {
    return jsonError('Invalid request body.', 400)
  }

  const productSlug = normalizeProductSlug(body.productSlug)
  const action = body.action || 'toggle'

  if (!productSlug) return jsonError('Product slug is required.', 400)
  if (!['add', 'remove', 'toggle'].includes(action)) return jsonError('Invalid wishlist action.', 400)

  const { data: product, error: productError } = await context.admin
    .from('products')
    .select('id,slug,name,status,shopify_product_id,shopify_variant_legacy_id')
    .eq('slug', productSlug)
    .maybeSingle()

  if (productError) return jsonError(productError.message, 500)
  if (!product || !['active', 'launch'].includes(String(product.status || '')) || !product.shopify_product_id || !product.shopify_variant_legacy_id) {
    return jsonError('Product is not available for wishlist.', 404)
  }

  const { data: existing } = await context.admin
    .from('customer_wishlists')
    .select('id')
    .eq('auth_user_id', context.user.id)
    .eq('product_slug', productSlug)
    .maybeSingle()

  if (action === 'remove' || (action === 'toggle' && existing?.id)) {
    await context.admin
      .from('customer_wishlists')
      .delete()
      .eq('auth_user_id', context.user.id)
      .eq('product_slug', productSlug)

    return NextResponse.json({ ok: true, inWishlist: false, action: 'removed' })
  }

  const { error: insertError } = await context.admin
    .from('customer_wishlists')
    .upsert({
      auth_user_id: context.user.id,
      customer_id: context.customer.id,
      product_slug: productSlug,
    }, { onConflict: 'auth_user_id,product_slug' })

  if (insertError) return jsonError(insertError.message, 500)

  return NextResponse.json({ ok: true, inWishlist: true, action: existing?.id ? 'kept' : 'added' })
}
