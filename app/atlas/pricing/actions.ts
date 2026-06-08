'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAtlasPermission } from '@/lib/atlas-auth'
import { calculatePricing, parseCardmarketPriceText, parseMoney, roundMoney } from '@/lib/pricing'

function value(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

function boolValue(formData: FormData, key: string) {
  return formData.get(key) === 'on'
}

function numberOrNull(formData: FormData, key: string) {
  const parsed = parseMoney(value(formData, key))
  return typeof parsed === 'number' ? parsed : null
}

function pricingRedirect(params: Record<string, string>) {
  const search = new URLSearchParams(params)
  redirect(`/atlas/pricing?${search.toString()}`)
}

async function getProduct(admin: any, slug: string) {
  const { data, error } = await admin
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Product niet gevonden.')
  return data as Record<string, any>
}

async function insertPricingLog(admin: any, row: Record<string, any>) {
  const { error } = await admin.from('product_pricing_logs').insert(row)
  if (error) {
    // Keep pricing usable even before the SQL migration is run.
    console.warn('product_pricing_logs insert failed', error.message)
  }
}

export async function updatePricingInput(formData: FormData) {
  const { admin, user } = await assertAtlasPermission('pricing', '/atlas/pricing')
  const slug = value(formData, 'slug')
  if (!slug) return

  try {
    const product = await getProduct(admin, slug)
    const pasted = value(formData, 'cardmarket_text')
    const parsed = parseCardmarketPriceText(pasted)
    const manualMarketValue = numberOrNull(formData, 'market_value')
    const marketValue = manualMarketValue || parsed.preferredMarketValue || Number(product.market_value || 0)
    const minMarginPercent = numberOrNull(formData, 'min_margin_percent') ?? Number(product.min_margin_percent ?? 15)
    const minPrice = numberOrNull(formData, 'min_price') ?? Number(product.min_price || 0)
    const priceLocked = boolValue(formData, 'price_locked')
    const autoPricingEnabled = boolValue(formData, 'auto_pricing_enabled')
    const source = value(formData, 'market_source') || parsed.preferredMetric || product.market_source || 'manual'

    const calculation = calculatePricing({
      currentPrice: Number(product.price || 0),
      estimatedCost: Number(product.estimated_cost || 0),
      estimatedShipping: Number(product.estimated_shipping || 0),
      marketValue,
      minMarginPercent,
      minPrice,
      priceLocked,
    })

    const updates = {
      cardmarket_url: value(formData, 'cardmarket_url'),
      market_value: marketValue || null,
      market_source: source,
      market_checked_at: marketValue ? new Date().toISOString() : product.market_checked_at,
      auto_pricing_enabled: autoPricingEnabled,
      min_margin_percent: minMarginPercent,
      min_price: minPrice || null,
      price_locked: priceLocked,
      pricing_status: calculation.status,
      suggested_price: calculation.suggestedPrice || null,
      last_pricing_note: value(formData, 'pricing_note') || calculation.note,
      pricing_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await admin.from('products').update(updates).eq('slug', slug)
    if (error) throw new Error(error.message)

    await insertPricingLog(admin, {
      product_slug: slug,
      product_name: product.name,
      action: 'calculated',
      old_price: product.price,
      market_value: marketValue || null,
      suggested_price: calculation.suggestedPrice || null,
      applied_price: null,
      min_safe_price: calculation.minSafePrice || null,
      margin_percent: calculation.marginPercent || null,
      source,
      status: calculation.status,
      note: value(formData, 'pricing_note') || calculation.note,
      actor_email: user.email,
      raw_input: pasted || null,
    })

    revalidatePath('/atlas/pricing')
    revalidatePath('/atlas/products')
  } catch (error) {
    pricingRedirect({ error: error instanceof Error ? error.message : 'Pricing update mislukt.' })
  }

  pricingRedirect({ saved: '1', product: slug })
}

export async function applySuggestedPrice(formData: FormData) {
  const { admin, user } = await assertAtlasPermission('pricing', '/atlas/pricing')
  const slug = value(formData, 'slug')
  if (!slug) return

  let redirectParams: Record<string, string> = { applied: '1', product: slug }

  try {
    const product = await getProduct(admin, slug)
    const calculation = calculatePricing({
      currentPrice: Number(product.price || 0),
      estimatedCost: Number(product.estimated_cost || 0),
      estimatedShipping: Number(product.estimated_shipping || 0),
      marketValue: Number(product.market_value || 0),
      minMarginPercent: Number(product.min_margin_percent ?? 15),
      minPrice: Number(product.min_price || 0),
      priceLocked: Boolean(product.price_locked),
    })

    if (!calculation.canApply) {
      const { error } = await admin.from('products').update({
        pricing_status: calculation.status,
        suggested_price: calculation.suggestedPrice || null,
        last_pricing_note: calculation.note,
        pricing_updated_at: new Date().toISOString(),
      }).eq('slug', slug)
      if (error) throw new Error(error.message)

      await insertPricingLog(admin, {
        product_slug: slug,
        product_name: product.name,
        action: 'blocked',
        old_price: product.price,
        market_value: calculation.marketValue || null,
        suggested_price: calculation.suggestedPrice || null,
        applied_price: null,
        min_safe_price: calculation.minSafePrice || null,
        margin_percent: calculation.marginPercent || null,
        source: product.market_source || 'manual',
        status: calculation.status,
        note: calculation.note,
        actor_email: user.email,
      })

      revalidatePath('/atlas/pricing')
      redirectParams = { error: calculation.note, product: slug }
    } else {
      const appliedPrice = roundMoney(calculation.suggestedPrice)
      const { error } = await admin.from('products').update({
        price: appliedPrice,
        pricing_status: 'applied',
        suggested_price: appliedPrice,
        last_pricing_note: `Prijs toegepast: ${calculation.note}`,
        pricing_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('slug', slug)
      if (error) throw new Error(error.message)

      await insertPricingLog(admin, {
        product_slug: slug,
        product_name: product.name,
        action: 'applied',
        old_price: product.price,
        market_value: calculation.marketValue,
        suggested_price: calculation.suggestedPrice,
        applied_price: appliedPrice,
        min_safe_price: calculation.minSafePrice,
        margin_percent: calculation.marginPercent,
        source: product.market_source || 'manual',
        status: 'applied',
        note: `Prijs aangepast van €${Number(product.price || 0).toFixed(2)} naar €${appliedPrice.toFixed(2)}.`,
        actor_email: user.email,
      })

      revalidatePath('/')
      revalidatePath('/shop')
      revalidatePath(`/product/${slug}`)
      revalidatePath('/atlas/pricing')
      revalidatePath('/atlas/products')
    }
  } catch (error) {
    pricingRedirect({ error: error instanceof Error ? error.message : 'Prijs toepassen mislukt.' })
  }

  pricingRedirect(redirectParams)
}
