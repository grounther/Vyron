'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAtlasAdmin } from '@/lib/atlas-auth'
import { addCJProductToMyProducts, queryCJProduct, resolveCjProductReference, type CJProductDetail, type CJVariant } from '@/lib/cj'

function value(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

function checkbox(formData: FormData, key: string) {
  return value(formData, key) === 'on' || value(formData, key) === 'true'
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

function parseNumberish(input: unknown) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : 0
  if (typeof input === 'string') {
    const parsed = Number(input.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function stripHtml(input: unknown) {
  if (typeof input !== 'string') return ''
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function jsonStringArray(input: unknown) {
  if (Array.isArray(input)) return input.map(String).filter(Boolean)
  if (typeof input !== 'string' || !input.trim()) return []
  try {
    const parsed = JSON.parse(input)
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [input]
  } catch {
    return [input]
  }
}

function unique(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map((v) => String(v || '').trim()).filter(Boolean)))
}

function stockForVariant(variant: CJVariant) {
  return (variant.inventories || []).reduce((sum, inventory) => {
    const total =
      parseNumberish(inventory.totalInventory) ||
      parseNumberish(inventory.totalInventoryNum) ||
      parseNumberish(inventory.cjInventory) ||
      parseNumberish(inventory.cjInventoryNum) ||
      parseNumberish(inventory.factoryInventory) ||
      parseNumberish(inventory.factoryInventoryNum)
    return sum + total
  }, 0)
}

function nameFromUrl(productUrl: string) {
  const match = productUrl.match(/\/product\/([^/]+)-p-/i)
  if (!match?.[1]) return ''
  return match[1]
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function productImages(product: CJProductDetail) {
  const variantImages = (product.variants || []).map((variant) => variant.variantImage)
  return unique([product.bigImage, product.productImage, ...(product.productImageSet || []), ...variantImages])
}

function defaultWarehouse(countryCode: string) {
  const country = countryCode.trim().toUpperCase()
  if (country === 'US') return 'US'
  if (['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'PL', 'CZ'].includes(country)) return 'EU'
  if (country === 'GB' || country === 'UK') return 'UK'
  return 'China'
}

function cjImportRedirect(params: Record<string, string>) {
  const search = new URLSearchParams(params)
  redirect(`/atlas/products?${search.toString()}`)
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

export async function importCJProduct(formData: FormData) {
  const { admin } = await assertAtlasAdmin('/atlas/products')
  const submittedSku = value(formData, 'cj_import_sku').toUpperCase()
  const productUrl = value(formData, 'cj_import_url')
  const countryCode = value(formData, 'cj_country_code').toUpperCase() || undefined
  const ref = await resolveCjProductReference(productUrl || submittedSku, { productSku: submittedSku })
  const productSku = (submittedSku || ref.productSku).toUpperCase()
  const pid = ref.pid
  const variantSku = ref.variantSku
  const sourceUrl = productUrl || ref.sourceUrl

  if (!productSku && !pid && !variantSku) {
    cjImportRedirect({ cj_import: 'error', cj_message: 'Plak een CJ product URL, SPU/productSku, variantSku of PID.' })
  }

  try {
    const product = await queryCJProduct({ productSku, pid, variantSku, countryCode })
    const resolvedSku = product.productSku || productSku || variantSku
    const images = productImages(product)
    const hero = images[0] || '/products/asorta-product-fallback.svg'
    const firstVariant = (product.variants || [])[0]
    const variants = (product.variants || []).map((variant) => ({
      name: variant.variantNameEn || variant.variantKey || variant.variantSku || 'CJ variant',
      sku: variant.variantSku || '',
      variantId: variant.vid || '',
      image: variant.variantImage || hero,
      stock: stockForVariant(variant),
      cjPid: variant.pid || product.pid || '',
      cjProductSku: resolvedSku,
      cjVariantKey: variant.variantKey || '',
      costUsd: parseNumberish(variant.variantSellPrice),
      weightGrams: parseNumberish(variant.variantWeight),
    }))
    const supplierNotes: string[] = []

    if (checkbox(formData, 'cj_add_to_my_product') && product.pid) {
      try {
        await addCJProductToMyProducts(product.pid)
        supplierNotes.push('CJ: product toegevoegd aan My Products via API.')
      } catch (error) {
        supplierNotes.push(`CJ My Products melding: ${error instanceof Error ? error.message : 'onbekende CJ melding'}`)
      }
    }

    const name = value(formData, 'cj_import_name') || product.productNameEn || nameFromUrl(sourceUrl) || `CJ product ${resolvedSku || product.pid || 'import'}`
    const slug = slugify(value(formData, 'cj_import_slug') || name)
    const status = value(formData, 'cj_import_status') || 'archived'
    const categoryName = product.categoryName || 'CJ product'
    const logisticAttributes = unique([
      ...jsonStringArray(product.productProEn),
      ...(product.productProEnSet || []),
    ])
    const estimatedCost = parseNumberish(firstVariant?.variantSellPrice) || parseNumberish(product.sellPrice)
    const customDescription = value(formData, 'cj_import_description')
    const description = customDescription || stripHtml(product.description).slice(0, 2200)
    const variantIds = unique((product.variants || []).map((variant) => variant.vid))
    const selectedCategory = value(formData, 'cj_import_category') || 'smart-utility'

    const row = {
      slug,
      name,
      category: selectedCategory,
      price: numberOrNull(formData, 'cj_import_price') || 0,
      compare_at: numberOrNull(formData, 'cj_import_compare_at'),
      estimated_cost: estimatedCost || null,
      supplier_name: 'CJ Dropshipping',
      supplier_url: sourceUrl,
      cj_product_id: product.pid || pid || '',
      cj_variant_id: firstVariant?.vid || '',
      cj_sku: firstVariant?.variantSku || resolvedSku,
      cj_variant_ids: variantIds,
      cj_pid: product.pid || pid || '',
      cj_product_sku: resolvedSku,
      cj_source_url: sourceUrl,
      cj_raw_product: product,
      cj_last_synced_at: new Date().toISOString(),
      cj_variant_count: variants.length,
      cj_import_status: 'imported',
      cj_product_category_name: categoryName,
      cj_product_weight: parseNumberish(product.productWeight) || null,
      cj_sell_price_usd: parseNumberish(product.sellPrice) || null,
      cj_suggest_sell_price: product.suggestSellPrice || '',
      cj_logistic_attributes: logisticAttributes,
      warehouse: defaultWarehouse(countryCode || 'CN'),
      status,
      hero_image: hero,
      images,
      badge: value(formData, 'cj_import_badge') || 'CJ Import',
      short_description: value(formData, 'cj_import_short') || product.productNameEn || name,
      description,
      features: unique([
        product.productKeyEn ? `Options: ${product.productKeyEn}` : '',
        categoryName ? `CJ category: ${categoryName}` : '',
        logisticAttributes.length ? `Logistics: ${logisticAttributes.join(', ')}` : '',
        product.listedNum ? `CJ listed count: ${product.listedNum}` : '',
      ]),
      specs: unique([
        resolvedSku ? `CJ SPU/Product SKU: ${resolvedSku}` : '',
        product.pid ? `CJ PID: ${product.pid}` : '',
        product.entryCode ? `HS code: ${product.entryCode}` : '',
        product.entryNameEn ? `Customs name: ${product.entryNameEn}` : '',
        product.productWeight ? `Product weight: ${product.productWeight}g` : '',
        product.packingWeight ? `Packing weight: ${product.packingWeight}g` : '',
        variants.length ? `Variants: ${variants.length}` : '',
        countryCode ? `Imported with warehouse filter: ${countryCode}` : '',
      ]),
      tags: unique(['cj-import', selectedCategory, ...(categoryName || '').toLowerCase().split(/[\s/,&]+/)]).slice(0, 16),
      box_items: ['1x product as supplied by CJ Dropshipping', 'Supplier packaging'],
      shipping_info: 'Shipping method, freight cost and delivery estimate are managed in Atlas fulfilment rules before publishing.',
      content_ideas: ['Unboxing/product demo', 'Use case video', 'Problem-solution angle'],
      supplier_notes: unique([
        resolvedSku ? `Imported from CJ with SPU ${resolvedSku}.` : 'Imported from CJ.',
        sourceUrl ? `Source: ${sourceUrl}` : '',
        'Check product quality, compliance, warranty, return risk, shipping method and image rights before publishing.',
        ...supplierNotes,
      ]).join('\n'),
      margin_note: estimatedCost
        ? `CJ variant cost imported in USD: $${estimatedCost.toFixed(2)}. Set final EUR retail price and shipping/margin before publishing.`
        : 'Set final EUR retail price, shipping and margin before publishing.',
      estimated_shipping: numberOrNull(formData, 'cj_import_shipping'),
      supplier_status: 'imported',
      processing_time: '',
      delivery_time: '',
      variants,
      videos: [],
      updated_at: new Date().toISOString(),
    }

    const { error } = await admin.from('products').upsert(row, { onConflict: 'slug' })
    if (error) throw new Error(error.message)

    const mappingRows = (product.variants || [])
      .filter((variant) => variant.vid || variant.variantSku)
      .map((variant) => ({
        product_slug: slug,
        variant_name: variant.variantNameEn || variant.variantKey || variant.variantSku || 'CJ variant',
        cj_pid: product.pid || pid || '',
        cj_product_sku: resolvedSku,
        cj_vid: variant.vid || variant.variantSku || '',
        cj_variant_sku: variant.variantSku || '',
        cj_variant_key: variant.variantKey || '',
        cj_variant_image: variant.variantImage || hero,
        cj_variant_sell_price_usd: parseNumberish(variant.variantSellPrice) || null,
        cj_variant_weight_g: parseNumberish(variant.variantWeight) || null,
        cj_inventory: variant.inventories || [],
        enabled: true,
        updated_at: new Date().toISOString(),
      }))

    if (mappingRows.length) {
      const { error: mappingError } = await admin
        .from('cj_product_mappings')
        .upsert(mappingRows, { onConflict: 'product_slug,cj_vid' })
      if (mappingError) throw new Error(mappingError.message)
    }

    await admin.from('cj_import_logs').insert({
      product_slug: slug,
      cj_pid: product.pid || pid || '',
      cj_product_sku: resolvedSku,
      source_url: sourceUrl,
      status: 'success',
      message: `Imported ${name}`,
      payload: product,
    })

    revalidatePath('/atlas/products')
    revalidatePath('/shop')
    revalidatePath(`/product/${slug}`)
    cjImportRedirect({ cj_import: 'success', cj_message: `CJ product ${resolvedSku || product.pid || 'import'} is geimporteerd als ${name}.` })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'CJ import mislukt.'
    try {
      await admin.from('cj_import_logs').insert({
        cj_product_sku: productSku || variantSku,
        cj_pid: pid,
        source_url: sourceUrl,
        status: 'error',
        message,
        payload: { productSku, pid, variantSku, sourceUrl, countryCode },
      })
    } catch {
      // Ignore logging failures so the user still gets the real CJ/import error.
    }
    cjImportRedirect({ cj_import: 'error', cj_message: message.slice(0, 260) })
  }
}

export async function saveProduct(formData: FormData) {
  const { admin } = await assertAtlasAdmin('/atlas/products')

  const name = value(formData, 'name')
  const slug = slugify(value(formData, 'slug') || name)
  if (!name || !slug) throw new Error('Productnaam en slug zijn verplicht.')

  const uploadedUrl = await uploadProductImage(formData, slug)
  const hero = uploadedUrl || value(formData, 'hero_image') || '/products/asorta-product-fallback.svg'
  const images = Array.from(new Set([hero, ...lines(formData, 'images')]))

  const row = {
    slug,
    name,
    category: value(formData, 'category') || 'smart-utility',
    price: numberOrNull(formData, 'price') || 0,
    compare_at: numberOrNull(formData, 'compare_at'),
    estimated_cost: numberOrNull(formData, 'estimated_cost'),
    supplier_name: value(formData, 'supplier_name'),
    supplier_url: value(formData, 'supplier_url'),
    cj_product_id: value(formData, 'cj_product_id'),
    cj_variant_id: value(formData, 'cj_variant_id'),
    cj_sku: value(formData, 'cj_sku'),
    cj_variant_ids: lines(formData, 'cj_variant_ids'),
    cj_pid: value(formData, 'cj_pid'),
    cj_product_sku: value(formData, 'cj_product_sku'),
    cj_source_url: value(formData, 'cj_source_url'),
    warehouse: value(formData, 'warehouse') || 'China',
    status: value(formData, 'status') || 'draft',
    hero_image: hero,
    images,
    badge: value(formData, 'badge') || 'New',
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
    supplier_status: value(formData, 'supplier_status') || 'testing',
    processing_time: value(formData, 'processing_time'),
    delivery_time: value(formData, 'delivery_time'),
    variants: jsonFromTextarea(formData, 'variants', []),
    videos: jsonFromTextarea(formData, 'videos', []),
    updated_at: new Date().toISOString(),
  }

  const { error } = await admin.from('products').upsert(row, { onConflict: 'slug' })
  if (error) throw new Error(error.message)

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
