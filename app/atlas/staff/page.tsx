import type React from 'react'
import Link from 'next/link'
import { BadgeCheck, ChevronDown, Lock, Plus, ShieldCheck, UserCog, UsersRound } from 'lucide-react'
import { assertAtlasPermission, displayNameFromEmail } from '@/lib/atlas-auth'
import { createStaffMember, updateStaffMember } from './actions'

export const metadata = { title: 'Medewerkers | Atlas', robots: { index: false, follow: false } }

type AnyRow = Record<string, any>

type StaffMember = {
  id: string
  email: string
  displayName: string
  role: string
  active: boolean
  status: string
  badges: string[]
  createdAt: string
  updatedAt: string
}

const BADGES = [
  { key: 'support', label: 'Support', text: 'Supportportaal, klantdossiers, Sorkai checks.' },
  { key: 'orders', label: 'Orders', text: 'Orderoverzicht en orderinformatie.' },
  { key: 'products', label: 'Producten', text: 'Producten beheren.' },
  { key: 'inventory', label: 'Voorraad', text: 'Online/marktvoorraad beheren.' },
  { key: 'pricing', label: 'Prijsbeheer', text: 'Cardmarket paste-helper en prijzen toepassen.' },
  { key: 'pages', label: 'Pagina’s', text: 'Page editor en homepage content.' },
  { key: 'promotions', label: 'Acties', text: 'Promoties en acties.' },
  { key: 'newsletter', label: 'Nieuwsbrief', text: 'Drops en e-mailinschrijvingen.' },
  { key: 'recovery', label: 'Cart recovery', text: 'Abandoned carts.' },
  { key: 'seo', label: 'SEO', text: 'SEO instellingen.' },
  { key: 'integrations', label: 'Integraties', text: 'PayPal/Mollie/integratie-status.' },
  { key: 'settings', label: 'Admin', text: 'Medewerkers en gevoelige instellingen.' },
]

function dateTime(value: unknown) {
  const date = value ? new Date(String(value)) : null
  if (!date || Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function asBadges(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  return []
}

async function loadStaff(admin: any): Promise<{ members: StaffMember[]; owners: AnyRow[]; errors: string[] }> {
  const errors: string[] = []

  const { data: members = [], error: staffError } = await admin
    .from('atlas_staff_members')
    .select('id,email,display_name,role,active,status,created_at,updated_at,atlas_staff_badges(badge,active)')
    .order('created_at', { ascending: false })

  if (staffError) errors.push(staffError.message)

  const { data: owners = [], error: ownersError } = await admin
    .from('admin_users')
    .select('email,role,display_name,active,is_owner,created_at,updated_at')
    .eq('active', true)
    .order('email', { ascending: true })

  if (ownersError) errors.push(ownersError.message)

  const mapped = ((members || []) as AnyRow[]).map((row) => {
    const email = String(row.email || '').toLowerCase()
    const badgeRows = Array.isArray(row.atlas_staff_badges) ? row.atlas_staff_badges : []
    const badges = badgeRows.filter((badge: AnyRow) => badge.active !== false).map((badge: AnyRow) => String(badge.badge || '')).filter(Boolean)
    return {
      id: String(row.id),
      email,
      displayName: String(row.display_name || '').trim() || displayNameFromEmail(email),
      role: String(row.role || 'staff'),
      active: row.active !== false && row.status !== 'disabled',
      status: String(row.status || (row.active === false ? 'disabled' : 'active')),
      badges,
      createdAt: dateTime(row.created_at),
      updatedAt: dateTime(row.updated_at),
    }
  })

  return { members: mapped, owners: (owners || []) as AnyRow[], errors }
}

export default async function AtlasStaffPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { admin, staff } = await assertAtlasPermission('settings', '/atlas/staff')
  const params = searchParams ? await searchParams : {}
  const { members, owners, errors } = await loadStaff(admin)
  const saved = params.saved ? 'Medewerker opgeslagen.' : ''
  const error = typeof params.error === 'string' ? params.error : ''

  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(183,200,173,.18),transparent_35%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Atlas beheer</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Medewerkers</h1>
          <p className="mt-4 max-w-2xl text-white/60">Beheer wie Atlas mag gebruiken. Supportmedewerkers kunnen alleen het supportportaal zien; owners/admins houden volledige controle.</p>
        </div>
        <Link href="/atlas" className="btn-secondary">Terug naar Atlas</Link>
      </div>
    </section>

    {error ? <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">{error}</div> : null}
    {saved ? <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">{saved}</div> : null}
    {errors.length ? <div className="mt-6 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">{errors.join(' | ')}</div> : null}

    <section className="mt-8 grid gap-4 md:grid-cols-3">
      <InfoCard icon={<UsersRound />} label="Medewerkers" value={String(members.length)} text="Actieve en uitgeschakelde staff accounts." />
      <InfoCard icon={<BadgeCheck />} label="Support" value={String(members.filter((m) => m.active && m.badges.includes('support')).length)} text="Accounts met support badge." />
      <InfoCard icon={<ShieldCheck />} label="Ingelogd als" value={staff.displayName} text={staff.email} />
    </section>

    <details open className="card mt-8 rounded-[2rem]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-xl font-black [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-3"><Plus className="text-[#b7c8ad]" /> Medewerker toevoegen</span>
        <ChevronDown className="text-white/45" />
      </summary>
      <form action={createStaffMember} className="border-t border-white/10 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-white/70">Login e-mail of naam
            <input name="email" required placeholder="lisa of lisa@asorta.nl" className="support-input" />
            <span className="text-xs font-normal text-white/40">Als je alleen een naam invult, wordt automatisch @asorta.nl toegevoegd.</span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-white/70">Display name optioneel
            <input name="display_name" placeholder="Automatisch uit e-mailadres" className="support-input" />
            <span className="text-xs font-normal text-white/40">Bij lisa@asorta.nl wordt dit automatisch Lisa.</span>
          </label>
        </div>
        <BadgeGrid defaultBadges={["support"]} />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button className="btn-primary" type="submit">+ Medewerker toevoegen</button>
          <p className="text-xs leading-5 text-white/40">Nieuwe medewerkers moeten zelf kunnen inloggen met hun @asorta.nl e-mail via Supabase Auth.</p>
        </div>
      </form>
    </details>

    <section className="mt-8 grid gap-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black">Alle medewerkers</h2>
        <span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-white/45">{members.length} staff</span>
      </div>
      {members.length ? members.map((member) => <StaffEditor key={member.id} member={member} />) : <div className="card rounded-[2rem] p-8 text-center text-white/45">Nog geen medewerkers toegevoegd. Gebruik de knop hierboven om de eerste supportmedewerker aan te maken.</div>}
    </section>

    <section className="mt-8 rounded-[2rem] border border-white/10 bg-black/30 p-5">
      <h2 className="flex items-center gap-2 text-xl font-black"><Lock className="text-[#b7c8ad]" /> Owner/admin accounts</h2>
      <p className="mt-2 text-sm leading-6 text-white/50">Deze accounts komen uit <code>admin_users</code> en behouden volledige Atlas-toegang. Jouw owner-account blijft <strong>o.kelder.raalte@gmail.com</strong>.</p>
      <div className="mt-4 grid gap-3">
        {owners.map((owner) => <div key={String(owner.email)} className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/[.03] p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div><strong>{String(owner.display_name || '').trim() || displayNameFromEmail(String(owner.email || ''))}</strong><p className="text-white/45">{String(owner.email || '')}</p></div>
          <span className="rounded-full bg-[#b7c8ad]/10 px-3 py-1 text-xs font-black uppercase tracking-[.16em] text-[#dbe9d4]">{String(owner.role || 'admin')}</span>
        </div>)}
      </div>
    </section>
  </main>
}

function InfoCard({ icon, label, value, text }: { icon: React.ReactNode; label: string; value: string; text: string }) {
  return <div className="card rounded-[1.5rem] p-5"><div className="text-[#b7c8ad]">{icon}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 text-2xl font-black">{value}</p><p className="mt-2 text-xs leading-5 text-white/45">{text}</p></div>
}

function BadgeGrid({ defaultBadges = [], memberBadges = [] }: { defaultBadges?: string[]; memberBadges?: string[] }) {
  const active = new Set([...defaultBadges, ...memberBadges])
  return <div className="mt-5">
    <p className="mb-3 text-sm font-black uppercase tracking-[.18em] text-white/40">Badges / rechten</p>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {BADGES.map((badge) => <label key={badge.key} className="flex cursor-pointer gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-white/20">
        <input type="checkbox" name={`badge_${badge.key}`} defaultChecked={active.has(badge.key)} className="mt-1 h-4 w-4 accent-[#b7c8ad]" />
        <span><span className="block font-black">{badge.label}</span><span className="mt-1 block text-xs leading-5 text-white/45">{badge.text}</span></span>
      </label>)}
    </div>
  </div>
}

function StaffEditor({ member }: { member: StaffMember }) {
  return <details className="card rounded-[2rem]" open={member.active}>
    <summary className="flex cursor-pointer list-none flex-col gap-3 p-5 [&::-webkit-details-marker]:hidden sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-xl font-black">{member.displayName}</h3>
        <p className="mt-1 text-sm text-white/45">{member.email}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[.14em] ${member.active ? 'bg-emerald-500/10 text-emerald-100' : 'bg-red-500/10 text-red-100'}`}>{member.active ? 'active' : 'disabled'}</span>
        {member.badges.map((badge) => <span key={badge} className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-bold text-white/55">{badge}</span>)}
        <ChevronDown className="text-white/35" />
      </div>
    </summary>
    <form action={updateStaffMember} className="border-t border-white/10 p-5">
      <input type="hidden" name="staff_id" value={member.id} />
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-bold text-white/70">Display name
          <input name="display_name" defaultValue={member.displayName} className="support-input" />
        </label>
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm text-white/55"><strong className="text-white/80">Aangemaakt</strong><br />{member.createdAt}</div>
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4 text-sm text-white/55"><strong className="text-white/80">Laatst bijgewerkt</strong><br />{member.updatedAt}</div>
      </div>
      <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[.025] p-4 font-bold text-white/70">
        <input type="checkbox" name="active" defaultChecked={member.active} className="h-4 w-4 accent-[#b7c8ad]" /> Medewerker actief
      </label>
      <BadgeGrid memberBadges={member.badges} />
      <div className="mt-5 flex justify-end"><button type="submit" className="btn-primary">Medewerker opslaan</button></div>
    </form>
  </details>
}
