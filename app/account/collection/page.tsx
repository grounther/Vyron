import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTcgState } from '@/lib/tcg-game-server'
import { cardVisualClass, rarityLabel, tcgCardCatalog, tcgSeries } from '@/lib/tcg-game'
import TcgPackOpener from '@/components/TcgPackOpener'

export const metadata = { title: 'Mijn ASORTA collectie | ASORTA' }

export default async function AccountCollectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login?next=/account/collection')

  const admin = createAdminClient()
  let packCount = 0
  let collection: any[] = []

  if (admin) {
    try {
      const state = await getTcgState(admin, user)
      packCount = state.availablePackCount
      collection = state.collection
    } catch {
      packCount = 0
      collection = []
    }
  }

  const owned = new Map(collection.map((row) => [`${row.card_id}:${row.variant}`, row]))
  const uniqueOwned = new Set(collection.map((row) => row.card_id)).size

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.35em] text-[#f6d36c]">ASORTA TCG Collectie</p>
          <h1 className="mt-4 text-5xl font-black md:text-7xl">Mijn verzameling</h1>
          <p className="mt-4 max-w-2xl text-white/60">Verzamel alle kaarten uit Perfect Order en Chaos Rising. Dit zijn digitale ASORTA collectiekaarten, gekoppeld aan je account.</p>
        </div>
        <Link href="/account" className="rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/65 hover:bg-white/10 hover:text-white">Terug naar account</Link>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Stat label="Beschikbare pakjes" value={String(packCount)} />
        <Stat label="Unieke kaarten" value={`${uniqueOwned}/${tcgCardCatalog.length}`} />
        <Stat label="Totaal kaarten" value={String(collection.reduce((sum, row) => sum + Number(row.quantity || 0), 0))} />
      </section>

      <section className="mt-8 card rounded-[2rem] p-6">
        <TcgPackOpener initialPackCount={packCount} compact />
      </section>

      <section className="mt-8 grid gap-8">
        {tcgSeries.map((series) => {
          const cards = tcgCardCatalog.filter((card) => card.series === series.key)
          const ownedInSeries = cards.filter((card) => collection.some((row) => row.card_id === card.id)).length
          return (
            <div key={series.key} className="card rounded-[2rem] p-6">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="kicker">{series.name}</p>
                  <h2 className="mt-2 text-3xl font-black">{ownedInSeries}/{cards.length} verzameld</h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-white/55">{series.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                {cards.map((card) => {
                  const variants = collection.filter((row) => row.card_id === card.id)
                  const best = variants[0]
                  const isOwned = Boolean(best)
                  const qty = variants.reduce((sum, row) => sum + Number(row.quantity || 0), 0)
                  return (
                    <div key={card.id} className={`rounded-[1.3rem] border p-3 ${isOwned ? 'border-white/12 bg-white/[.04]' : 'border-white/5 bg-black/35 opacity-45'}`}>
                      <div className={`grid aspect-[.72] place-items-center rounded-2xl border bg-gradient-to-br p-3 text-center ${isOwned ? cardVisualClass(card) : 'border-white/10 bg-black/30'}`}>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[.18em] text-white/35">{card.number}</p>
                          <h3 className="mt-3 text-sm font-black leading-tight">{isOwned ? card.name : '???'}</h3>
                          <p className="mt-2 text-[11px] text-white/45">{isOwned ? card.type : 'Niet gevonden'}</p>
                          {isOwned ? <p className="mt-3 line-clamp-3 text-[10px] leading-4 text-white/38">{card.flavor}</p> : null}
                        </div>
                      </div>
                      <p className="mt-3 text-[10px] font-black uppercase tracking-[.16em] text-white/35">{rarityLabel(card.rarity)}</p>
                      <p className="mt-1 text-xs text-white/55">{isOwned ? `x${qty}` : 'Nog niet in collectie'}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="card rounded-[1.5rem] p-5"><p className="text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>
}
