import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiteContent, groupSiteContentFields, siteContentDefaults } from '@/lib/site-content'
import { saveSiteContent } from './actions'
import { FileText, Save, Sparkles } from 'lucide-react'

export const metadata = { title: 'Atlas Pages | ASORTA internal', robots: { index: false, follow: false } }

async function assertAdmin(){
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/atlas-access?next=/atlas/pages')
  const admin = createAdminClient()
  if (admin) {
    const { data } = await admin.from('admin_users').select('email').eq('email', user.email).eq('active', true).maybeSingle()
    if (!data) redirect('/atlas-access?next=/atlas/pages')
  }
}

export default async function AtlasPages(){
  await assertAdmin()
  const content = await getSiteContent()
  const grouped = groupSiteContentFields(siteContentDefaults)

  return <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
    <Link href="/atlas" className="text-sm font-black text-white/50 hover:text-white">← Back to Atlas</Link>

    <section className="mt-6 card rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-center gap-3">
          <FileText className="text-[#b7c8ad]" />
          <div>
            <p className="kicker">Atlas live editor</p>
            <h1 className="text-4xl font-black">Page Editor</h1>
          </div>
        </div>

        <div className="rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 px-4 py-3 text-sm font-bold text-[#dbe9d4]">
          Live gekoppeld aan Supabase site_content
        </div>
      </div>

      <p className="mt-4 max-w-2xl text-white/55">
        Beheer homepage teksten zonder code push. Opslaan schrijft veilig naar Supabase en vernieuwt de homepage rendering.
      </p>

      <form action={saveSiteContent} className="mt-8 grid gap-6">
        {Object.entries(grouped).map(([group, fields]) => (
          <section key={group} className="rounded-[1.5rem] border border-white/10 bg-white/[.025] p-4 md:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-[#b7c8ad]" />
              <h2 className="text-sm font-black uppercase tracking-[.24em] text-white/55">{group}</h2>
            </div>

            <div className="grid gap-4">
              {fields.map((field) => (
                <label key={field.key} className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[.20em] text-white/38">{field.label}</span>
                  {field.type === 'textarea' ? (
                    <textarea
                      name={field.key}
                      defaultValue={content[field.key] || field.value}
                      rows={4}
                      className="min-h-28 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#b7c8ad]"
                    />
                  ) : (
                    <input
                      name={field.key}
                      defaultValue={content[field.key] || field.value}
                      className="rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-[#b7c8ad]"
                    />
                  )}
                </label>
              ))}
            </div>
          </section>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary" type="submit"><Save size={18} className="mr-2"/> Save & publish</button>
          <Link href="/" className="btn-secondary">Preview homepage</Link>
        </div>
      </form>
    </section>
  </main>
}
