import { NextResponse } from 'next/server'
import { assertAtlasAdmin } from '@/lib/atlas-auth'
import { campaignEmailHtml, sendResendEmail } from '@/lib/newsletter'

export async function POST(request: Request) {
  try {
    const { admin } = await assertAtlasAdmin('/atlas/newsletter')
    const body = await request.json().catch(() => ({}))
    const campaignId = String(body.campaignId || '').trim()

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId ontbreekt.' }, { status: 400 })
    }

    const { data: campaign, error: campaignError } = await admin
      .from('newsletter_campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: campaignError?.message || 'Campagne niet gevonden.' }, { status: 404 })
    }

    const query = admin
      .from('newsletter_subscribers')
      .select('email,tags')
      .eq('status', 'subscribed')

    const { data: subscribers, error: subscriberError } = await query
    if (subscriberError) throw subscriberError

    const recipients = (subscribers || [])
      .filter((subscriber) => !campaign.target_tag || (subscriber.tags || []).includes(campaign.target_tag))
      .map((subscriber) => subscriber.email)

    if (!recipients.length) {
      return NextResponse.json({ error: 'Geen actieve ontvangers gevonden.' }, { status: 400 })
    }

    const html = campaignEmailHtml({
      eyebrow: campaign.campaign_type || 'ASORTA Drop',
      title: campaign.title,
      body: campaign.body,
      ctaLabel: campaign.cta_label,
      ctaUrl: campaign.cta_url,
    })

    const mail = await sendResendEmail({
      to: recipients,
      subject: campaign.subject,
      html,
    })

    if (mail.error) {
      return NextResponse.json({ error: mail.error }, { status: 500 })
    }

    await admin
      .from('newsletter_campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', campaignId)

    await admin
      .from('newsletter_subscribers')
      .update({ last_email_sent: new Date().toISOString() })
      .eq('status', 'subscribed')

    return NextResponse.json({ ok: true, count: recipients.length })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Campagne versturen is niet gelukt.' }, { status: 500 })
  }
}
