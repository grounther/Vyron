import { createAdminClient } from '@/lib/supabase/admin'

export type NewsletterStatus = 'subscribed' | 'unsubscribed' | 'bounced'

export type NewsletterSubscriber = {
  id: string
  email: string
  name: string | null
  source: string | null
  status: NewsletterStatus
  confirmed: boolean
  tags: string[]
  subscribed_at: string
  updated_at: string
  last_email_sent: string | null
}

export type NewsletterCampaign = {
  id: string
  subject: string
  preview: string | null
  title: string
  body: string
  cta_label: string | null
  cta_url: string | null
  campaign_type: string
  target_tag: string | null
  status: 'draft' | 'sent'
  sent_at: string | null
  created_at: string
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function getNewsletterSubscribers() {
  const admin = createAdminClient()
  if (!admin) return [] as NewsletterSubscriber[]

  const { data, error } = await admin
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false })
    .limit(500)

  if (error || !data) return []
  return data as NewsletterSubscriber[]
}

export async function getNewsletterCampaigns() {
  const admin = createAdminClient()
  if (!admin) return [] as NewsletterCampaign[]

  const { data, error } = await admin
    .from('newsletter_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data) return []
  return data as NewsletterCampaign[]
}

export function welcomeEmailHtml(name?: string | null) {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi ASORTA Insider,'
  return emailShell({
    eyebrow: 'ASORTA Insiders',
    title: 'Je staat op de early access lijst.',
    body: `${greeting}

Je ontvangt straks als eerste exclusieve drops, launch acties en geselecteerde kortingen. Geen spam — alleen ASORTA updates die waarde hebben.`,
    ctaLabel: 'Bekijk ASORTA',
    ctaUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://asorta.nl',
  })
}

export function campaignEmailHtml(input: { eyebrow?: string; title: string; body: string; ctaLabel?: string | null; ctaUrl?: string | null }) {
  return emailShell(input)
}

function emailShell({ eyebrow = 'ASORTA', title, body, ctaLabel, ctaUrl }: { eyebrow?: string; title: string; body: string; ctaLabel?: string | null; ctaUrl?: string | null }) {
  const safeTitle = escapeHtml(title)
  const safeEyebrow = escapeHtml(eyebrow)
  const normalizedBody = body
    .split('\n')
    .map((line) => escapeHtml(line))
    .join('<br/>')

  return `<!doctype html><html><body style="margin:0;background:#050505;color:#f4f4f4;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:32px 12px;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#0b0b0b;border:1px solid rgba(255,255,255,.12);border-radius:24px;overflow:hidden;"><tr><td style="padding:34px 30px;background:linear-gradient(135deg,#050505,#111814);"><div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#b7c8ad;font-weight:800;">${safeEyebrow}</div><h1 style="margin:14px 0 0;font-size:34px;line-height:1.05;color:#fff;">${safeTitle}</h1><p style="margin:18px 0 0;color:rgba(255,255,255,.68);font-size:16px;line-height:1.7;">${normalizedBody}</p>${ctaLabel && ctaUrl ? `<a href="${escapeAttribute(ctaUrl)}" style="display:inline-block;margin-top:24px;background:#fff;color:#050505;text-decoration:none;border-radius:999px;padding:13px 20px;font-weight:900;">${escapeHtml(ctaLabel)}</a>` : ''}<p style="margin:28px 0 0;color:rgba(255,255,255,.38);font-size:12px;line-height:1.6;">ASORTA — Just what you need.</p></td></tr></table></td></tr></table></body></html>`
}

export async function sendResendEmail(input: { to: string | string[]; subject: string; html: string; replyTo?: string }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.NEWSLETTER_FROM || 'ASORTA <info@asorta.nl>'

  if (!apiKey) {
    return { skipped: true, error: 'RESEND_API_KEY ontbreekt' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      reply_to: input.replyTo || 'info@asorta.nl',
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    return { skipped: false, error: data?.message || 'Resend mail failed', data }
  }

  return { skipped: false, error: null, data }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char] || char))
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, '&#096;')
}
