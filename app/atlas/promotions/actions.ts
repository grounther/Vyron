'use server'

import { revalidatePath } from 'next/cache'
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

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function datetimeOrNull(formData: FormData, key: string) {
  const raw = value(formData, key)
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export async function saveAction(formData: FormData) {
  const { admin } = await assertAtlasAdmin('/atlas/promotions')

  const title = value(formData, 'title')
  const slug = slugify(value(formData, 'slug') || title)
  if (!title || !slug) throw new Error('Titel en slug zijn verplicht.')

  const row = {
    slug,
    title,
    subtitle: value(formData, 'subtitle'),
    body: value(formData, 'body'),
    code: value(formData, 'code').toUpperCase(),
    discount_type: value(formData, 'discount_type') || 'percentage',
    discount_value: numberOrNull(formData, 'discount_value'),
    button_text: value(formData, 'button_text') || 'Shop action',
    button_href: value(formData, 'button_href') || '/shop',
    badge_text: value(formData, 'badge_text') || 'Action',
    placement: value(formData, 'placement') || 'global',
    active: formData.get('active') === 'on',
    starts_at: datetimeOrNull(formData, 'starts_at'),
    ends_at: datetimeOrNull(formData, 'ends_at'),
    applies_to_all: formData.get('applies_to_all') === 'on',
    product_slugs: lines(formData, 'product_slugs'),
    category_slugs: lines(formData, 'category_slugs'),
    priority: numberOrNull(formData, 'priority') || 100,
    theme: value(formData, 'theme') || 'blue-red',
    updated_at: new Date().toISOString(),
  }

  const { error } = await admin.from('site_actions').upsert(row, { onConflict: 'slug' })
  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/product/[slug]', 'page')
  revalidatePath('/atlas/promotions')
}

export async function deleteAction(formData: FormData) {
  const { admin } = await assertAtlasAdmin('/atlas/promotions')
  const slug = value(formData, 'slug')
  if (!slug) return

  const { error } = await admin.from('site_actions').delete().eq('slug', slug)
  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/atlas/promotions')
}
