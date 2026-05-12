import Link from 'next/link'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Mail, Save, Trash2, Users } from 'lucide-react'
import { assertAtlasAdmin } from '@/lib/atlas-auth'
import { getNewsletterCampaigns, getNewsletterSubscribers, type NewsletterCampaign } from '@/lib/newsletter'
import { deleteCampaign, saveCampaign, updateSubscriberStatus } from './actions'
import SendCampaignButton from './SendCampaignButton'

export const metadata = { title: 'Atlas Newsletter | ASORTA internal', robots: { index: false, follow: false } }

export default async function AtlasNewsletterPage() {
  await assertAtlasAdmin('/atlas/newsletter')
  const [subscribers, campaigns] = await Promise.all([getNewsletterSubscribers(), getNewsletterCampaigns()])
  const active = subscribers.filter((subscriber) => subscriber.status === 'subscribed').length

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <Link href="/atlas" className="text-sm font-black text-white/50 hover:text-white">← Back to Atlas</Link>

      <section className="mt-6 card rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-3">
            <Mail className="text-[#b7c8ad]" />
            <div>
              <p className="kicker">Atlas email automation</p>
              <h1 className="text-4xl font-black">Exclusive Drops</h1>
            </div>
          </div>
          <div className="rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 px-4 py-3 text-sm font-bold text-[#dbe9d4]">{active} active subscribers</div>
        </div>
        <p className="mt-4 max-w-3xl text-white/55">Beheer homepage inschrijvingen, welkom mails, exclusive drop campagnes en kortingsmails via Resend + Supabase.</p>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[.95fr_1.05fr]">
        <div className="card rounded-[1.7rem] p-5">
          <div className="mb-5 flex items-center gap-2"><Users className="text-[#b7c8ad]" /><h2 className="text-2xl font-black">Subscribers</h2></div>
          <div className="max-h-[720px] overflow-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-white/[.04] text-xs uppercase tracking-[.18em] text-white/35"><tr><th className="px-4 py-3">Email</th><th>Name</th><th>Status</th><th>Source</th><th>Action</th></tr></thead>
              <tbody>{subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="border-t border-white/10 text-white/65">
                  <td className="px-4 py-3 font-black text-white">{subscriber.email}</td>
                  <td>{subscriber.name || '-'}</td>
                  <td>{subscriber.status}</td>
                  <td>{subscriber.source || '-'}</td>
                  <td>
                    <form action={updateSubscriberStatus} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={subscriber.id} />
                      <select name="status" defaultValue={subscriber.status} className="rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-xs text-white">
                        <option value="subscribed">subscribed</option>
                        <option value="unsubscribed">unsubscribed</option>
                        <option value="bounced">bounced</option>
                      </select>
                      <button className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-white/60">Save</button>
                    </form>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-5">
          <details className="card rounded-[1.7rem] p-5" open={!campaigns.length}>
            <summary className="cursor-pointer text-xl font-black">Nieuwe campaign</summary>
            <CampaignForm />
          </details>

          {campaigns.map((campaign) => (
            <details key={campaign.id} className="card rounded-[1.7rem] p-5">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.22em] text-white/35">{campaign.campaign_type} • {campaign.status}</p>
                    <h2 className="text-2xl font-black">{campaign.subject}</h2>
                    <p className="mt-1 text-sm text-white/45">{campaign.preview || campaign.title}</p>
                  </div>
                  <SendCampaignButton campaignId={campaign.id} disabled={campaign.status === 'sent'} />
                </div>
              </summary>
              <CampaignForm campaign={campaign} />
              <form action={deleteCampaign} className="mt-4 border-t border-white/10 pt-4">
                <input type="hidden" name="id" value={campaign.id} />
                <button type="submit" className="inline-flex items-center rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-black text-red-200 transition hover:bg-red-500/20"><Trash2 size={16} className="mr-2" /> Delete campaign</button>
              </form>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}

function CampaignForm({ campaign }: { campaign?: NewsletterCampaign }) {
  return (
    <form action={saveCampaign} className="mt-5 grid gap-4">
      {campaign?.id && <input type="hidden" name="id" value={campaign.id} />}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Subject" name="subject" defaultValue={campaign?.subject || ''} required />
        <Field label="Preview text" name="preview" defaultValue={campaign?.preview || ''} />
        <Field label="Titel in mail" name="title" defaultValue={campaign?.title || ''} required />
        <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">Campaign type</span><select name="campaign_type" defaultValue={campaign?.campaign_type || 'exclusive_drop'} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]"><option value="exclusive_drop">exclusive_drop</option><option value="discount">discount</option><option value="early_access">early_access</option><option value="announcement">announcement</option></select></label>
        <Field label="Target tag" name="target_tag" defaultValue={campaign?.target_tag || ''} placeholder="exclusive-drops leeg = iedereen" />
        <Field label="CTA label" name="cta_label" defaultValue={campaign?.cta_label || 'Shop ASORTA'} />
        <Field label="CTA URL" name="cta_url" defaultValue={campaign?.cta_url || 'https://asorta.nl/shop'} />
      </div>
      <Textarea label="Body" name="body" defaultValue={campaign?.body || ''} rows={7} required />
      <button className="btn-primary w-fit" type="submit"><Save size={18} className="mr-2" /> Save campaign</button>
    </form>
  )
}

function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">{label}</span><input {...props} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#b7c8ad]" /></label>
}

function Textarea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">{label}</span><textarea {...props} className="min-h-24 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#b7c8ad]" /></label>
}
