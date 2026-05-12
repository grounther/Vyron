import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidEmail, normalizeEmail, sendResendEmail, welcomeEmailHtml } from '@/lib/newsletter'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = normalizeEmail(String(body.email || ''))
    const name = String(body.name || '').trim() || null
    const source = String(body.source || 'homepage_exclusive_drops').trim()
    const tags = Array.isArray(body.tags) ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean) : ['exclusive-drops']

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Vul een geldig e-mailadres in.' }, { status: 400 })
    }

    const admin = createAdminClient()
    if (!admin) {
      return NextResponse.json({ error: 'Newsletter database is nog niet geconfigureerd.' }, { status: 500 })
    }

    const { data: existing } = await admin
      .from('newsletter_subscribers')
      .select('id,email,status,tags')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      const mergedTags = Array.from(new Set([...(existing.tags || []), ...tags]))
      const { error } = await admin
        .from('newsletter_subscribers')
        .update({
          name,
          source,
          status: 'subscribed',
          confirmed: true,
          tags: mergedTags,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email)

      if (error) throw error
      return NextResponse.json({ ok: true, alreadySubscribed: true })
    }

    const now = new Date().toISOString()
    const { error } = await admin.from('newsletter_subscribers').insert({
      email,
      name,
      source,
      status: 'subscribed',
      confirmed: true,
      tags,
      subscribed_at: now,
      updated_at: now,
    })

    if (error) throw error

    const mail = await sendResendEmail({
      to: email,
      subject: 'Welkom bij ASORTA Insiders',
      html: welcomeEmailHtml(name),
    })

    await admin
      .from('newsletter_subscribers')
      .update({ last_email_sent: mail.error ? null : new Date().toISOString() })
      .eq('email', email)

    return NextResponse.json({ ok: true, mailSkipped: mail.skipped, mailError: mail.error })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Inschrijven is niet gelukt.' }, { status: 500 })
  }
}
