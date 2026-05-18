import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteContent, groupSiteContentFields, siteContentDefaults } from '@/lib/site-content'
import { saveSiteContent } from './actions'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, FileText, Lock, Save } from 'lucide-react'

export const metadata = { title: 'Atlas Page Editor | ASORTA internal', robots: { index: false, follow: false } }

type PageSearchParams = Promise<{ saved?: string; error?: string }>

export default async function AtlasPagesPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const params = searchParams ? await searchParams : {}
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/atlas-access?next=/atlas/pages')

  const admin = createAdminClient()
  let isAdmin = false
  let adminCheckReady = false

  if (admin) {
    const { data } = await admin.from('admin_users').select('email').eq('email', user.email).eq('active', true).maybeSingle()
    isAdmin = Boolean(data)
    adminCheckReady = true
  }

  if (adminCheckReady && !isAdmin) {
    return <main className="mx-auto max-w-xl px-4 py-16 md:px-6"><div className="card rounded-[2rem] p-6 text-center"><Lock className="mx-auto text-[#b7c8ad]" size={42}/><h1 className="mt-4 text-3xl font-black">Access denied</h1><p className="mt-3 text-white/55">Dit account heeft geen ASORTA Atlas rechten.</p></div></main>
  }

  const content = await getSiteContent()
  const grouped = groupSiteContentFields(siteContentDefaults)
  const pages = Object.entries(grouped)

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(111,125,100,.18),transparent_38%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Atlas editor</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Page Editor</h1>
          <p className="mt-4 max-w-3xl text-white/60">Beheer alle klantgerichte teksten van de vaste ASORTA pagina’s. Productnamen, prijzen en productbeschrijvingen beheer je via Shopify/Product Editor; deze editor is voor pagina-copy, trust teksten, CTA’s, legal teksten en orderflow-teksten.</p>
        </div>
        <Link href="/atlas" className="rounded-full border border-white/12 px-5 py-3 text-sm font-black text-white/65 transition hover:bg-white/10 hover:text-white">Terug naar Atlas</Link>
      </div>
    </section>

    {params?.saved ? <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100/80"><CheckCircle2 size={18}/> Page content opgeslagen en pagina’s gerevalideerd.</div> : null}
    {params?.error ? <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100/80"><AlertTriangle size={18}/> {decodeURIComponent(params.error)}</div> : null}
    {!adminCheckReady ? <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100/80"><AlertTriangle size={18}/> Service role key ontbreekt. Je kunt de editor bekijken, maar opslaan vereist SUPABASE_SERVICE_ROLE_KEY.</div> : null}

    <form action={saveSiteContent} className="mt-8 grid gap-6">
      <div className="sticky top-20 z-20 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-black/75 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><FileText className="text-[#b7c8ad]"/><div><p className="font-black">Alle pagina teksten</p><p className="text-xs text-white/45">{siteContentDefaults.length} velden verdeeld over {pages.length} secties.</p></div></div>
        <button className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-[#dfe8d8]" type="submit"><Save size={17} className="mr-2"/> Alles opslaan</button>
      </div>

      {pages.map(([pageName, groups]) => <section key={pageName} className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5 md:p-7">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[.25em] text-[#b7c8ad]">Editable page</p><h2 className="mt-2 text-2xl font-black md:text-3xl">{pageName}</h2></div>
          <p className="text-sm text-white/40">Velden worden opgeslagen in Supabase <code>site_content</code>.</p>
        </div>
        <div className="grid gap-5">
          {Object.entries(groups).map(([groupName, fields]) => <div key={`${pageName}-${groupName}`} className="rounded-[1.4rem] border border-white/10 bg-black/30 p-4 md:p-5">
            <h3 className="text-sm font-black uppercase tracking-[.18em] text-white/45">{groupName}</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {fields.map((field) => <label key={field.key} className={field.type === 'textarea' ? 'grid gap-2 md:col-span-2' : 'grid gap-2'}>
                <span className="text-sm font-black text-white/72">{field.label}</span>
                <span className="text-[11px] text-white/28">{field.key}</span>
                {field.type === 'textarea'
                  ? <textarea name={field.key} defaultValue={content[field.key] ?? field.value} rows={Math.min(10, Math.max(4, String(content[field.key] ?? field.value).split('\n').length + 2))} className="min-h-32 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-[#b7c8ad]" />
                  : <input name={field.key} defaultValue={content[field.key] ?? field.value} className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white outline-none transition focus:border-[#b7c8ad]" />}
              </label>)}
            </div>
          </div>)}
        </div>
      </section>)}
    </form>
  </main>
}
