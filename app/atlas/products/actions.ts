'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAtlasAdmin } from '@/lib/atlas-auth'

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
