import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FileText, Home, Search, ShieldCheck } from 'lucide-react'

export const metadata = { title: 'Atlas Pages | ASORTA internal', robots: { index: false, follow: false } }

const editableSections = [
  { key: 'homepage.hero.title', label: 'Homepage hero title', value: 'ASORTA' },
  { key: 'homepage.hero.subtitle', label: 'Homepage subtitle', value: 'Just what you need.' },
  { key: 'homepage.hero.description', label: 'Hero description', value: 'Premium utility products for modern living, travel, desk setups and automotive upgrades.' },
  { key: 'shipping.delivery.estimate', label: 'Delivery estimate', value: '6–12 business days with tracked shipping. Exceptions may apply during peak periods, customs or carrier delays.' },
  { key: 'support.contact.email', label: 'Support email', value: 'To be added after business setup.' },
  { key: 'seo.home.title', label: 'Homepage SEO title', value: 'ASORTA | Just what you need.' },
  { key: 'seo.home.description', label: 'Homepage SEO description', value: 'ASORTA curates modern utility products with a premium shopping experience.' },
]

export default async function AtlasPages(){
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/atlas-access?next=/atlas/pages')

  const admin = createAdminClient()
  if (admin) {
    const { data } = await admin.from('admin_users').select('email, active').eq('email', user.email).eq('active', true).maybeSingle()
    if (!data) redirect('/account')
  }

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Atlas editor foundation</p>
        <h1 className="mt-3 text-4xl font-black md:text-6xl">Page Editor</h1>
        <p className="mt-3 max-w-2xl text-white/55">Voorbereiding voor live contentbeheer via Supabase. In v5 worden deze velden opslaan/bewerken zonder code.</p>
      </div>
      <Link href="/atlas" className="btn-secondary">Back to Atlas</Link>
    </div>

    <section className="grid gap-5 lg:grid-cols-[1fr_.42fr]">
      <div className="card rounded-[2rem] p-5">
        <h2 className="text-2xl font-black">Editable content blocks</h2>
        <div className="mt-5 grid gap-3">
          {editableSections.map(section => <div key={section.key} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[.22em] text-white/35">{section.key}</p>
                <h3 className="mt-1 font-black">{section.label}</h3>
              </div>
              <span className="rounded-full bg-[#b7c8ad]/10 px-3 py-1 text-xs font-black text-[#b7c8ad]">planned live edit</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/55">{section.value}</p>
          </div>)}
        </div>
      </div>
      <aside className="card rounded-[2rem] p-5">
        <h2 className="text-2xl font-black">v5 roadmap</h2>
        <div className="mt-5 grid gap-3 text-sm text-white/58">
          <Step icon={<FileText/>} title="site_content table" text="Key/value content blocks for pages, SEO and FAQ." />
          <Step icon={<Home/>} title="Live homepage edits" text="Hero, CTA, category intros and support text." />
          <Step icon={<Search/>} title="SEO editor" text="Titles, descriptions and searchable landing sections." />
          <Step icon={<ShieldCheck/>} title="Admin-only writes" text="Only Atlas owners can update published page content." />
        </div>
      </aside>
    </section>
  </main>
}

function Step({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="text-[#b7c8ad]">{icon}</div><h3 className="mt-3 font-black text-white">{title}</h3><p className="mt-1 leading-6">{text}</p></div>}
