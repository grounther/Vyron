'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAtlasAdmin } from '@/lib/atlas-auth'

function value(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim()
}

export async function saveCampaign(formData: FormData) {
  const { admin } = await assertAtlasAdmin('/atlas/newsletter')

  const id = value(formData, 'id') || undefined
  const subject = value(formData, 'subject')
  const title = value(formData, 'title')
  const body = value(formData, 'body')

  if (!subject || !title || !body) {
    throw new Error('Subject, titel en body zijn verplicht.')
  }

  const row = {
    ...(id ? { id } : {}),
    subject,
    preview: value(formData, 'preview'),
    title,
    body,
    cta_label: value(formData, 'cta_label'),
    cta_url: value(formData, 'cta_url'),
    campaign_type: value(formData, 'campaign_type') || 'exclusive_drop',
    target_tag: value(formData, 'target_tag') || null,
    status: 'draft',
    updated_at: new Date().toISOString(),
  }

  const { error } = await admin.from('newsletter_campaigns').upsert(row)
  if (error) throw new Error(error.message)

  revalidatePath('/atlas/newsletter')
  redirect('/atlas/newsletter')
}

export async function deleteCampaign(formData: FormData) {
  const { admin } = await assertAtlasAdmin('/atlas/newsletter')
  const id = value(formData, 'id')
  if (!id) return

  const { error } = await admin.from('newsletter_campaigns').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/atlas/newsletter')
  redirect('/atlas/newsletter')
}

export async function updateSubscriberStatus(formData: FormData) {
  const { admin } = await assertAtlasAdmin('/atlas/newsletter')
  const id = value(formData, 'id')
  const status = value(formData, 'status') || 'subscribed'
  if (!id) return

  const { error } = await admin
    .from('newsletter_subscribers')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/atlas/newsletter')
}
