'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAtlasAdmin } from '@/lib/atlas-auth'
import {
  addCjProductToMyProducts,
  buildCjProductUrl,
  createCjProductConnection,
  extractCjProductReference,
  firstText,
  getCjIntegrationStatus,
  inventoryValue,
  numberValue,
  queryCjProduct,
  type CjProductDetail,
  type CjProductVariant,
} from '@/lib/cj'

function value(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
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

function stripHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function imageList(product: CjProductDetail) {
  const set = Array.isArray(product.productImageSet) ? product.productImageSet.map(String) : []
  return Array.from(new Set([
    firstText(product.bigImage, product.productImage),
    ...set,
  ].filter(Boolean)))
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

function buildVariantRows(product: CjProductDetail) {
  const images = imageList(product)
  const productImage = firstText(images[0], product.bigImage, product.productImage, '/products/asorta-product-fallback.svg')
  const variants = Array.isArray(product.variants) ? product.variants : []

  if (!variants.length) {
    const sku = firstText(product.productSku, product.sku, 'CJ-VARIANT')
    return [{
      name: firstText(product.productNameEn, product.productName, 'Default'),
      sku,
      variantId: '',
      image: productImage,
      stock: undefined,
      price: numberValue(product.sellPrice, numberValue(product.nowPrice, 0)) || undefined,
      cjPid: firstText(product.pid, product.id),
      cjVid: '',
      cjSku: sku,
    }]
  }

  return variants.map((variant: CjProductVariant, index: number) => {
    const name = firstText(variant.variantNameEn, variant.variantName, variant.variantKey, variant.variantStandard, `Variant ${index + 1}`)
    const sku = firstText(variant.variantSku, `${product.productSku || 'CJ'}-${index + 1}`)
    const sellPrice = numberValue(variant.variantSellPrice, numberValue(variant.sellPrice, numberValue(product.sellPrice, numberValue(product.nowPrice, 0))))
    const inventory = inventoryValue(variant)

    return {
      name,
      sku,
      variantId: firstText(variant.vid),
      image: firstText(variant.variantImage, productImage),
      stock: inventory ?? undefined,
      price: sellPrice || undefined,
      cjPid: firstText(variant.pid, product.pid, product.id),
      cjVid: firstText(variant.vid),
      cjSku: sku,
    }
  })
}

function mapCjProductToProductRow(formData: FormData, product: CjProductDetail, sourceInput: string, pid: string, productSku: string) {
  const shopName = value(formData, 'shop_name') || firstText(product.productNameEn, product.productName, productSku, 'CJ imported product')
  const slug = slugify(value(formData, 'slug') || shopName)
  const priceMultiplier = numberOrNull(formData, 'price_multiplier') || 2.35
  const variants = buildVariantRows(product)
  const firstVariant = variants[0]
  const cjSellPrice = numberValue(firstVariant?.price, numberValue(product.sellPrice, numberValue(product.nowPrice, 0)))
  const estimatedShipping = numberOrNull(formData, 'estimated_shipping') ?? 0
  const estimatedCost = cjSellPrice ? Number((cjSellPrice + estimatedShipping).toFixed(2)) : numberOrNull(formData, 'estimated_cost')
  const price = numberOrNull(formData, 'price') || Number(Math.max(14.95, estimatedCost ? estimatedCost * priceMultiplier : 39.95).toFixed(2))
  const compareAt = numberOrNull(formData, 'compare_at') || Number((price * 1.33).toFixed(2))
  const images = Array.from(new Set([
    ...imageList(product),
    firstText(firstVariant?.image, '/products/asorta-product-fallback.svg'),
    ...variants.map((variant) => variant.image).filter(Boolean),
  ]))
  const description = stripHtml(firstText(product.description))
  const categoryName = firstText(product.categoryName, product.threeCategoryName)
  const sourceCountryCode = value(formData, 'source_country_code') || 'CN'
  const cjPid = firstText(product.pid, product.id, pid)
  const cjSpu = firstText(product.productSku, product.sku, productSku)
  const cjProductUrl = buildCjProductUrl(sourceInput, cjPid, cjSpu)

  return {
    row: {
      slug,
      name: shopName,
      category: value(formData, 'category') || 'automotive',
      price,
      compare_at: compareAt,
      estimated_cost: estimatedCost,
      supplier_name: 'CJ Dropshipping',
      supplier_url: cjProductUrl,
      cj_product_id: cjSpu,
      cj_variant_id: firstText(firstVariant?.cjVid),
      cj_sku: firstText(firstVariant?.cjSku, cjSpu),
      cj_variant_ids: variants.map((variant) => firstText(variant.cjVid, variant.cjSku)).filter(Boolean),
      warehouse: sourceCountryCode === 'CN' ? 'China' : sourceCountryCode,
      status: value(formData, 'status') || 'draft',
      hero_image: images[0] || '/products/asorta-product-fallback.svg',
      images,
      badge: value(formData, 'badge') || 'CJ Import',
      short_description: value(formData, 'short_description') || `${shopName} imported from CJ for ASORTA validation.`,
      description: value(formData, 'description') || description || `${shopName} is imported from CJ. Review claims, compatibility and shipping before publishing.`,
      features: lines(formData, 'features').length ? lines(formData, 'features') : [
        'Imported from CJ Dropshipping',
        'Variant mapping stored for fulfilment',
        categoryName ? `CJ category: ${categoryName}` : 'Supplier data attached',
        'Review product claims before launch',
      ],
      specs: [
        cjSpu ? `CJ SPU: ${cjSpu}` : '',
        cjPid ? `CJ PID: ${cjPid}` : '',
        categoryName ? `CJ category: ${categoryName}` : '',
        product.productWeight ? `Product weight: ${product.productWeight}g` : '',
        firstText(product.packingWeight, product.packWeight) ? `Packing weight: ${firstText(product.packingWeight, product.packWeight)}g` : '',
      ].filter(Boolean),
      tags: lines(formData, 'tags').length ? lines(formData, 'tags') : ['cj-import', 'automotive', 'dashcam'],
      box_items: lines(formData, 'box_items').length ? lines(formData, 'box_items') : ['1× product set as supplied by CJ', 'Supplier packaging'],
      shipping_info: value(formData, 'shipping_info') || 'Tracked delivery. Final shipping method and delivery estimate are confirmed through CJ freight calculation.',
      content_ideas: lines(formData, 'content_ideas'),
      supplier_notes: value(formData, 'supplier_notes') || 'Imported from CJ. Check image rights, product quality, compliance, warranty, return risk and shipping method before publishing.',
      margin_note: value(formData, 'margin_note') || 'Review CJ product cost, freight cost, payment fees and VAT before activating paid ads.',
      estimated_shipping: estimatedShipping || null,
      supplier_status: value(formData, 'supplier_status') || 'testing',
      processing_time: value(formData, 'processing_time') || firstText(product.deliveryCycle),
      delivery_time: value(formData, 'delivery_time'),
      variants: variants.map(({ cjPid: _cjPid, cjVid: _cjVid, cjSku: _cjSku, price: _price, ...variant }) => variant),
      videos: [],
      cj_spu: cjSpu,
      cj_pid: cjPid,
      cj_product_url: cjProductUrl,
      cj_source_country_code: sourceCountryCode,
      cj_default_logistic_name: value(formData, 'default_logistic_name'),
      cj_sync_status: 'imported',
      cj_last_imported_at: new Date().toISOString(),
      cj_raw_payload: product,
      updated_at: new Date().toISOString(),
    },
    variants,
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
    cj_product_id: value(formData, 'cj_product_id') || value(formData, 'cj_spu'),
    cj_variant_id: value(formData, 'cj_variant_id'),
    cj_sku: value(formData, 'cj_sku'),
    cj_variant_ids: lines(formData, 'cj_variant_ids'),
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
    cj_spu: value(formData, 'cj_spu'),
    cj_pid: value(formData, 'cj_pid'),
    cj_product_url: value(formData, 'cj_product_url'),
    cj_source_country_code: value(formData, 'cj_source_country_code') || 'CN',
    cj_default_logistic_name: value(formData, 'cj_default_logistic_name'),
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

export async function importCjProduct(formData: FormData) {
  const { admin } = await assertAtlasAdmin('/atlas/products')
  const input = value(formData, 'cj_input')
  const manualSpu = value(formData, 'cj_spu')
  const manualPid = value(formData, 'cj_pid')
  const countryCode = value(formData, 'source_country_code') || 'CN'
  const ref = extractCjProductReference(`${manualSpu} ${manualPid} ${input}`)
  const productSku = manualSpu || ref.productSku
  const pid = manualPid || ref.pid

  if (!input && !productSku && !pid) throw new Error('Vul een CJ product URL, SPU/productSku of PID in.')

  const product = await queryCjProduct({ productSku, pid, countryCode })
  const { row, variants } = mapCjProductToProductRow(formData, product, input, pid, productSku)

  const { data: savedProduct, error } = await admin
    .from('products')
    .upsert(row, { onConflict: 'slug' })
    .select('id, slug')
    .single()

  if (error) throw new Error(error.message)

  const mappingRows = variants
    .map((variant) => ({
      product_id: savedProduct?.id || null,
      product_slug: row.slug,
      platform_variant_sku: variant.sku,
      platform_variant_name: variant.name,
      cj_pid: firstText(variant.cjPid, row.cj_pid),
      cj_spu: row.cj_spu,
      cj_vid: firstText(variant.cjVid),
      cj_variant_sku: firstText(variant.cjSku, variant.sku),
      cj_variant_name: variant.name,
      cj_variant_image: variant.image,
      source_country_code: row.cj_source_country_code,
      default_logistic_name: row.cj_default_logistic_name,
      inventory: typeof variant.stock === 'number' ? variant.stock : null,
      cj_price: typeof variant.price === 'number' ? variant.price : null,
      enabled: true,
      raw_payload: variant,
      updated_at: new Date().toISOString(),
    }))
    .filter((mapping) => mapping.cj_vid || mapping.cj_variant_sku)

  if (mappingRows.length) {
    const { error: mappingError } = await admin
      .from('cj_product_mappings')
      .upsert(mappingRows, { onConflict: 'product_slug,cj_vid,cj_variant_sku' })

    if (mappingError) throw new Error(mappingError.message)
  }

  if (formData.get('add_to_my_products') === 'on' && row.cj_pid) {
    try {
      await addCjProductToMyProducts(row.cj_pid)
    } catch {
      // Non-blocking. Product import should still succeed when CJ already has it or denies add-to-my-products.
    }
  }

  const status = getCjIntegrationStatus()
  const shouldCreateOfficialConnection = formData.get('try_product_connection') === 'on' && status.productConnectionsEnabled

  if (shouldCreateOfficialConnection && row.cj_pid && mappingRows.length && row.cj_default_logistic_name) {
    try {
      await createCjProductConnection({
        platformProductId: row.slug,
        cjProductId: row.cj_pid,
        logistics: row.cj_default_logistic_name,
        sourceCountryCode: row.cj_source_country_code,
        sourceCountry: row.cj_source_country_code === 'CN' ? 'China' : row.cj_source_country_code,
        targetCountryCode: value(formData, 'target_country_code') || 'NL',
        targetCountry: value(formData, 'target_country') || 'Netherlands',
        variantList: mappingRows
          .filter((mapping) => mapping.cj_vid)
          .map((mapping) => ({ cjVariantId: mapping.cj_vid, platformVariantId: mapping.platform_variant_sku || mapping.cj_variant_sku })),
      })
    } catch {
      // Non-blocking. The local mapping is enough for our own fulfilment bridge.
    }
  }

  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath(`/product/${row.slug}`)
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
