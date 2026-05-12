import Link from 'next/link'
import { ArrowRight, Sparkles, Tag } from 'lucide-react'
import type { SiteAction } from '@/lib/actions'
import { formatActionDiscount } from '@/lib/actions'

export default function ActionBanner({ action, compact = false }: { action?: SiteAction; compact?: boolean }) {
  if (!action) return null

  return (
    <section className={compact ? 'mx-auto max-w-7xl px-5 py-6' : 'mx-auto max-w-7xl px-5 py-10'}>
      <div className="asorta-action-banner relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.035] p-6 shadow-[0_28px_110px_rgba(0,0,0,.42)] md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(122,166,184,.20),transparent_30%),radial-gradient(circle_at_88%_20%,rgba(190,36,67,.18),transparent_32%),linear-gradient(120deg,rgba(255,255,255,.065),rgba(255,255,255,.018))]" />
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/[.055] blur-3xl" />
        <div className="relative z-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="kicker flex items-center gap-2"><Sparkles size={15} className="text-[#7aa6b8]" /> Live action</p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{action.title}</h2>
            <p className="mt-2 text-lg font-black uppercase tracking-[.22em] text-white/45">{action.subtitle || formatActionDiscount(action)}</p>
            {action.body && <p className="mt-4 max-w-3xl leading-7 text-white/58">{action.body}</p>}
          </div>
          <div className="grid gap-3 md:min-w-[270px]">
            {action.code && (
              <div className="rounded-2xl border border-white/10 bg-black/45 p-4 text-center backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[.24em] text-white/38">Action code</p>
                <p className="mt-1 flex items-center justify-center gap-2 text-2xl font-black"><Tag size={20} /> {action.code}</p>
              </div>
            )}
            <Link href={action.buttonHref || '/shop'} className="btn-primary w-full">
              {action.buttonText || 'Shop action'} <ArrowRight className="ml-2" size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
