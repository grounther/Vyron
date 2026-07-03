import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { getProducts } from '@/lib/catalog'

const fashionCategories = new Set(['ok-cotton', 'ok-linen', 'ok-tailoring', 'ok-overshirts', 'ok-silk'])

export const metadata = {
  title: 'OK Fashion Shop | ASORTA',
  description: 'De afzonderlijke OK Fashion shop binnen ASORTA.',
}

const plannedProducts = [
  {
    name: 'Premium Cotton T-shirt',
    note: 'Het dagelijkse premium basisitem met rustige luxe.',
  },
  {
    name: 'Linen Shirt',
    note: 'Luchtig, stijlvol en verfijnd voor warmere dagen.',
  },
  {
    name: 'Overshirt',
    note: 'De gestructureerde layer die de collectie karakter geeft.',
  },
  {
    name: 'Silk-Blend Shirt',
    note: 'Het meest verfijnde item van The First Edit.',
  },
  {
    name: 'Relaxed Cotton Trouser',
    note: 'Casual comfort met een volwassen uitstraling.',
  },
  {
    name: 'Linen Trouser',
    note: 'Een nette resort-broek met natuurlijke luxe.',
  },
  {
    name: 'Linen Short',
    note: 'Ontspannen, zomers en premium afgewerkt.',
  },
  {
    name: 'Fluid Trouser',
    note: 'Elegante valling en een zachte premium feel.',
  },
]

const collectionPoints = [
  'Eén shopbeleving volledig in OK Fashion stijl.',
  'Complete looks met bijpassende broeken en shorts.',
  'Kleine, subtiele OK-borduring op de linker mouw.',
]

export default async function OKFashionShopPage() {
  const products = (await getProducts()).filter(
    (p) => fashionCategories.has(p.category) || p.tags?.some((tag) => tag.toLowerCase().includes('ok fashion')),
  )

  return (
    <main className="ok-fashion min-h-screen bg-[#f3ecdf] px-4 py-6 text-[#1f1712] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-[#1f1712]/10 bg-[#f7f2e9] shadow-[0_35px_120px_rgba(95,73,48,.16)]">
          <div className="grid gap-8 border-b border-[#1f1712]/10 px-5 py-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr]">
            <div className="pt-2">
              <p className="text-xs font-black uppercase tracking-[.34em] text-[#7a6248]">OK Fashion shop</p>
              <h1 className="mt-4 font-serif text-5xl leading-[.9] tracking-[-.06em] sm:text-6xl lg:text-7xl">The First Edit</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#4b3d31]/78 sm:text-base">
                De shop is opgezet als een eigen luxe wereld binnen ASORTA: rustig, editorial en volledig los van de TCG-uitstraling.
                Producten die je in Atlas toevoegt onder de OK Fashion categorieën verschijnen hier automatisch.
              </p>
              <div className="mt-6 space-y-3">
                {collectionPoints.map((point) => (
                  <p key={point} className="flex items-start gap-2 text-sm text-[#4b3d31]/74">
                    <Check size={16} className="mt-1 shrink-0 text-[#7a6248]" />
                    {point}
                  </p>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/okfashion"
                  className="inline-flex items-center gap-2 rounded-full border border-[#1f1712]/14 px-6 py-3 text-sm font-black text-[#1f1712] transition hover:bg-[#1f1712]/5"
                >
                  Naar lookbook
                </Link>
                <span className="inline-flex items-center rounded-full bg-[#1f1712] px-6 py-3 text-sm font-black text-[#f7f2e9]">
                  Admin blijft gedeeld
                </span>
              </div>
            </div>
            <div className="overflow-hidden rounded-[1.7rem] border border-[#1f1712]/10 bg-[#f6efe3] p-3 shadow-[0_18px_70px_rgba(95,73,48,.10)]">
              <img src="/okfashion/ok-fashion-moodboard.png" alt="OK Fashion moodboard" className="h-full min-h-[420px] w-full rounded-[1.25rem] object-cover" />
            </div>
          </div>

          <div className="px-5 py-6 sm:px-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.30em] text-[#7a6248]">Shop preview</p>
                <h2 className="mt-3 font-serif text-3xl tracking-[-.04em] sm:text-4xl">Curated products</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#4b3d31]/68">
                Zodra je OK Fashion producten in het gedeelde admin panel beheert, verschijnen ze hieronder in deze afzonderlijke shopomgeving.
              </p>
            </div>

            {products.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {products.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/product/${p.slug}`}
                    className="overflow-hidden rounded-[1.5rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-4 shadow-[0_18px_60px_rgba(95,73,48,.08)] transition hover:-translate-y-1"
                  >
                    <img src={p.hero} alt="" className="aspect-[4/5] w-full rounded-[1.2rem] object-cover" />
                    <p className="mt-4 text-[11px] font-black uppercase tracking-[.24em] text-[#7a6248]">OK Fashion</p>
                    <h3 className="mt-2 font-serif text-2xl tracking-[-.03em]">{p.name}</h3>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm text-[#4b3d31]/65">Bekijk product</p>
                      <p className="text-lg font-black">€{p.price.toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {plannedProducts.map((product, index) => (
                  <article
                    key={product.name}
                    className="rounded-[1.5rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-4 shadow-[0_18px_60px_rgba(95,73,48,.08)]"
                  >
                    <div className="grid aspect-[4/5] place-items-center rounded-[1.2rem] bg-[linear-gradient(180deg,#f4ebdf,#e0d0ba)] text-center">
                      <div>
                        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-[#1f1712]/10 bg-[#f7f2e9] font-serif text-5xl italic tracking-[-.18em] text-[#38291f]">
                          OK
                        </div>
                        <p className="mt-4 text-[11px] font-black uppercase tracking-[.24em] text-[#7a6248]">Piece {String(index + 1).padStart(2, '0')}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-[11px] font-black uppercase tracking-[.24em] text-[#7a6248]">Coming soon</p>
                    <h3 className="mt-2 font-serif text-2xl tracking-[-.03em]">{product.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#4b3d31]/66">{product.note}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-[#1f1712]/10 bg-[#fcf8f1] px-6 py-5 shadow-[0_18px_60px_rgba(95,73,48,.08)]">
          <div>
            <p className="text-xs font-black uppercase tracking-[.30em] text-[#7a6248]">Need more fashion pages?</p>
            <h3 className="mt-2 font-serif text-3xl tracking-[-.04em]">De shop is nu in dezelfde sfeer als het lookbook</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#4b3d31]/68">
              Als je wilt, kan de volgende stap bestaan uit losse productdetailpagina’s, collectiefilters, een fashion cart-ervaring en een volledige OK Fashion checkout-flow.
            </p>
          </div>
          <Link
            href="/okfashion"
            className="inline-flex items-center gap-2 rounded-full bg-[#1f1712] px-6 py-3 text-sm font-black text-[#f7f2e9] transition hover:-translate-y-0.5"
          >
            Terug naar OK Fashion <ArrowRight size={17} />
          </Link>
        </section>
      </div>
    </main>
  )
}
