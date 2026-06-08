'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAtlasAdmin } from '@/lib/atlas-auth'

function value(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

function boolValue(formData: FormData, key: string) {
  return formData.get(key) === 'on'
}

function intOrNull(formData: FormData, key: string) {
  const raw = value(formData, key)
  if (!raw) return null
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null
}

function numberOrNull(formData: FormData, key: string) {
  const raw = value(formData, key)
  if (!raw) return null
  const parsed = Number(raw.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function lines(formData: FormData, key: string) {
  return value(formData, key)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function jsonFromTextarea<T>(formData: FormData, key: string, fallback: T) {
  const raw = value(formData, key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function variantsForManualProduct(formData: FormData, hero: string, price: number) {
  const parsed = jsonFromTextarea<any[]>(formData, 'variants', [])
  if (Array.isArray(parsed) && parsed.length) return parsed

  const sku = value(formData, 'supplier_sku')
  if (!sku) return []

  return [{
    name: 'Standaard',
    sku,
    price,
    image: hero,
  }]
}

function atlasProductsRedirect(params: Record<string, string>) {
  const search = new URLSearchParams(params)
  redirect(`/atlas/products?${search.toString()}`)
}

function deleteEmptyOptionalFields<T extends Record<string, unknown>>(row: T, keys: string[]) {
  for (const key of keys) {
    const current = row[key]
    if (
      current === null ||
      current === undefined ||
      current === '' ||
      (Array.isArray(current) && current.length === 0)
    ) {
      delete row[key]
    }
  }
  return row
}

async function uploadProductImage(formData: FormData, slug: string) {
  const { admin } = await assertAtlasAdmin('/atlas/products')
  const file = formData.get('image_file')

  if (!(file instanceof File) || file.size === 0) return ''

  const extension = file.name.split('.').pop() || 'jpg'
  const safeName = `${slug}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${extension}`

  const { error } = await admin.storage.from('product-images').upload(safeName, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || undefined,
  })

  if (error) throw new Error(error.message)

  const { data } = admin.storage.from('product-images').getPublicUrl(safeName)
  return data.publicUrl
}

export async function saveProduct(formData: FormData) {
  const { admin } = await assertAtlasAdmin('/atlas/products')

  const name = value(formData, 'name')
  const slug = slugify(value(formData, 'slug') || name)
  if (!name || !slug) throw new Error('Productnaam en slug zijn verplicht.')

  const uploadedUrl = await uploadProductImage(formData, slug)
  const hero = uploadedUrl || value(formData, 'hero_image') || '/products/asorta-product-fallback.svg'
  const images = Array.from(new Set([hero, ...lines(formData, 'images')]))

  const price = numberOrNull(formData, 'price') || 0
  const inventoryOnline = intOrNull(formData, 'inventory_online')
  const inventoryMarket = intOrNull(formData, 'inventory_market')
  const inventoryTotal = intOrNull(formData, 'inventory_total') ?? ((inventoryOnline || 0) + (inventoryMarket || 0))
  const supplierSku = value(formData, 'supplier_sku')
  const supplierName = value(formData, 'supplier_name') || 'Eigen voorraad'

  const row = deleteEmptyOptionalFields({
    slug,
    name,
    category: value(formData, 'category') || 'booster-packs',
    price,
    compare_at: numberOrNull(formData, 'compare_at'),
    estimated_cost: numberOrNull(formData, 'estimated_cost'),
    supplier: value(formData, 'supplier') || 'manual',
    supplier_sku: supplierSku,
    supplier_name: supplierName,
    supplier_url: value(formData, 'supplier_url'),
    inventory_online: inventoryOnline ?? 0,
    inventory_market: inventoryMarket ?? 0,
    inventory_total: inventoryTotal,
    sell_online: boolValue(formData, 'sell_online'),
    sell_market: boolValue(formData, 'sell_market'),
    hot_deal: boolValue(formData, 'hot_deal'),

    cardmarket_url: value(formData, 'cardmarket_url'),
    market_value: numberOrNull(formData, 'market_value'),
    market_source: value(formData, 'market_source'),
    auto_pricing_enabled: boolValue(formData, 'auto_pricing_enabled'),
    min_margin_percent: numberOrNull(formData, 'min_margin_percent'),
    min_price: numberOrNull(formData, 'min_price'),
    price_locked: boolValue(formData, 'price_locked'),
    condition_label: value(formData, 'condition_label') || 'Sealed',
    sealed_status: value(formData, 'sealed_status') || 'Origineel sealed',
    warehouse: value(formData, 'warehouse') || 'Eigen voorraad',
    status: value(formData, 'status') || 'draft',
    hero_image: hero,
    images,
    badge: value(formData, 'badge') || 'Eigen voorraad',
    short_description: value(formData, 'short_description'),
    description: value(formData, 'description'),
    features: lines(formData, 'features'),
    specs: lines(formData, 'specs'),
    tags: lines(formData, 'tags'),
    box_items: lines(formData, 'box_items'),
    shipping_info: value(formData, 'shipping_info'),
    content_ideas: lines(formData, 'content_ideas'),
    supplier_notes: value(formData, 'supplier_notes'),
    margin_note: value(formData, 'margin_note'),
    estimated_shipping: numberOrNull(formData, 'estimated_shipping'),
    supplier_status: value(formData, 'supplier_status') || 'manual',
    processing_time: value(formData, 'processing_time'),
    delivery_time: value(formData, 'delivery_time'),
    variants: variantsForManualProduct(formData, hero, price),
    videos: jsonFromTextarea(formData, 'videos', []),
    updated_at: new Date().toISOString(),
  }, ['supplier', 'supplier_sku', 'supplier_url'])

  const { error } = await admin.from('products').upsert(row, { onConflict: 'slug' })
  if (error) {
    atlasProductsRedirect({ save: 'error', save_message: error.message })
  }

  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath(`/product/${slug}`)
  revalidatePath(`/category/${row.category}`)
  revalidatePath('/atlas/products')
  redirect('/atlas/products')
}

export async function deleteProduct(formData: FormData) {
  const { admin } = await assertAtlasAdmin('/atlas/products')
  const slug = value(formData, 'slug')
  if (!slug) return

  const { error } = await admin.from('products').delete().eq('slug', slug)
  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/atlas/products')
  redirect('/atlas/products')
}
