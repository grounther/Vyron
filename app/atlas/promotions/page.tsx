import Link from 'next/link'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { assertAtlasAdmin } from '@/lib/atlas-auth'
import { getAllActions, type SiteAction } from '@/lib/actions'
import { categories } from '@/lib/products'
import { deleteAction, saveAction } from './actions'
import { Megaphone, Save, Sparkles, Trash2 } from 'lucide-react'

export const metadata = { title: 'Atlas Actions | ASORTA internal', robots: { index: false, follow: false } }

export default async function AtlasPromotions(){
  await assertAtlasAdmin('/atlas/promotions')
  const actions = await getAllActions()

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <Link href="/atlas" className="text-sm font-black text-white/50 hover:text-white">← Back to Atlas</Link>

    <section className="mt-6 card rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-center gap-3">
          <Megaphone className="text-[#b7c8ad]" />
          <div>
            <p className="kicker">Atlas action manager</p>
            <h1 className="text-4xl font-black">Acties</h1>
          </div>
        </div>
        <div className="rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 px-4 py-3 text-sm font-bold text-[#dbe9d4]">Live editable via Supabase</div>
      </div>
      <p className="mt-4 max-w-3xl text-white/55">Beheer homepage acties, shop banners, product badges en kortingscodes. Acties kunnen globaal gelden of alleen voor specifieke producten/categorieën.</p>

      <details className="mt-8 rounded-[1.5rem] border border-[#b7c8ad]/20 bg-[#b7c8ad]/[.06] p-4 md:p-5" open={!actions.length}>
        <summary className="flex cursor-pointer items-center gap-2 text-lg font-black"><Sparkles className="text-[#b7c8ad]"/> Nieuwe actie toevoegen</summary>
        <ActionForm mode="create" />
      </details>
    </section>

    <section className="mt-8 grid gap-5">
      {actions.map((action) => <details key={action.slug} className="card rounded-[1.7rem] p-5">
        <summary className="cursor-pointer list-none">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.22em] text-white/35">{action.placement} • {action.active ? 'active' : 'inactive'} • priority {action.priority}</p>
              <h2 className="text-2xl font-black">{action.title}</h2>
              <p className="mt-1 text-sm text-white/48">/{action.slug} {action.code ? `• code ${action.code}` : ''}</p>
            </div>
            <div className="rounded-full border border-white/10 bg-black/35 px-4 py-2 text-sm font-black text-white/60">{action.badgeText}</div>
          </div>
        </summary>
        <ActionForm mode="edit" action={action} />
        <form action={deleteAction} className="mt-4 border-t border-white/10 pt-4">
          <input type="hidden" name="slug" value={action.slug} />
          <button type="submit" className="inline-flex items-center rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-black text-red-200 transition hover:bg-red-500/20">
            <Trash2 size={16} className="mr-2"/> Delete action
          </button>
        </form>
      </details>)}
    </section>
  </main>
}

function ActionForm({ mode, action }:{ mode:'create'|'edit'; action?:SiteAction }){
  const a = action
  return <form action={saveAction} className="mt-6 grid gap-6">
    <div className="grid gap-4 md:grid-cols-3">
      <Field label="Titel" name="title" defaultValue={a?.title || ''} required />
      <Field label="Slug" name="slug" defaultValue={a?.slug || ''} placeholder="automatisch als leeg" />
      <Field label="Subtitle" name="subtitle" defaultValue={a?.subtitle || ''} />
      <Field label="Actiecode" name="code" defaultValue={a?.code || ''} placeholder="ASORTA10" />
      <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">Discount type</span><select name="discount_type" defaultValue={a?.discountType || 'percentage'} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]"><option value="percentage">Percentage</option><option value="fixed">Vast bedrag</option><option value="free_shipping">Gratis verzending</option><option value="custom">Custom tekst</option></select></label>
      <Field label="Discount waarde" name="discount_value" type="number" step="0.01" defaultValue={a?.discountValue == null ? '' : String(a.discountValue)} />
      <Field label="Button tekst" name="button_text" defaultValue={a?.buttonText || 'Shop action'} />
      <Field label="Button link" name="button_href" defaultValue={a?.buttonHref || '/shop'} />
      <Field label="Badge tekst" name="badge_text" defaultValue={a?.badgeText || 'Action'} />
      <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">Plaatsing</span><select name="placement" defaultValue={a?.placement || 'global'} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none focus:border-[#b7c8ad]"><option value="global">global</option><option value="homepage">homepage</option><option value="shop">shop</option><option value="product">product</option></select></label>
      <Field label="Priority" name="priority" type="number" defaultValue={String(a?.priority || 100)} />
      <Field label="Theme" name="theme" defaultValue={a?.theme || 'blue-red'} />
      <Field label="Startdatum/tijd" name="starts_at" type="datetime-local" defaultValue={toLocalDateTime(a?.startsAt)} />
      <Field label="Einddatum/tijd" name="ends_at" type="datetime-local" defaultValue={toLocalDateTime(a?.endsAt)} />
    </div>

    <Textarea label="Body tekst" name="body" defaultValue={a?.body || ''} rows={4} />

    <section className="rounded-[1.4rem] border border-white/10 bg-white/[.025] p-4">
      <h3 className="mb-4 font-black">Scope</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/35 p-4 text-sm font-black text-white/70"><input type="checkbox" name="active" defaultChecked={a?.active ?? true} /> Actief</label>
        <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/35 p-4 text-sm font-black text-white/70"><input type="checkbox" name="applies_to_all" defaultChecked={a?.appliesToAll ?? true} /> Geldt voor alle producten</label>
        <Textarea label="Product slugs, één per regel" name="product_slugs" defaultValue={(a?.productSlugs || []).join('\n')} rows={6} placeholder="asorta-urban-sling-pro" />
        <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">Categorie slugs</span><textarea name="category_slugs" defaultValue={(a?.categorySlugs || []).join('\n')} rows={6} placeholder={categories.map(c => c.slug).join('\n')} className="min-h-24 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#b7c8ad]" /></label>
      </div>
    </section>

    <div className="flex flex-wrap items-center gap-3">
      <button className="btn-primary" type="submit"><Save size={18} className="mr-2"/> {mode === 'create' ? 'Create action' : 'Save action'}</button>
    </div>
  </form>
}

function toLocalDateTime(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 16)
}

function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label:string }){
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">{label}</span><input {...props} className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#b7c8ad]" /></label>
}

function Textarea({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label:string }){
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.20em] text-white/38">{label}</span><textarea {...props} className="min-h-24 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#b7c8ad]" /></label>
}
