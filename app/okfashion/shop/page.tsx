import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import OkFashionGarment from '@/components/OkFashionGarment'
import { okFashionProducts, okFashionSets } from '@/lib/ok-fashion'

export const metadata = {
  title: 'OK Fashion Shop | ASORTA',
  description: 'De afzonderlijke OK Fashion shop binnen ASORTA met de geplande OK Fashion producten en verkoopkleuren.',
}

export default function OKFashionShopPage() {
  return (
    <main className="ok-fashion min-h-screen bg-[#f3ecdf] px-4 py-6 text-[#1f1712] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-[#1f1712]/10 bg-[#f7f2e9] shadow-[0_35px_120px_rgba(95,73,48,.16)]">
          <div className="grid gap-8 border-b border-[#1f1712]/10 px-5 py-6 sm:px-8 lg:grid-cols-[.9fr_1.1fr]">
            <div className="pt-2">
              <p className="text-xs font-black uppercase tracking-[.34em] text-[#7a6248]">OK Fashion shop</p>
              <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[.9] tracking-[-.06em] sm:text-6xl lg:text-7xl">Onze producten en verkoopkleuren</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#4b3d31]/78 sm:text-base">
                Dit is nu geen algemene placeholder meer. De shop toont de echte OK Fashion productlijn die wij gaan ontwikkelen: de bovenstukken, broeken en shorts, met de kleurstijlen die wij daadwerkelijk gaan verkopen.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  '8 kernproducten voor The First Edit.',
                  'Kleurvarianten per product zoals wij ze willen verkopen.',
                  'Productkaarten met mockup, materiaal, pasvorm, set en OK-logo detail.',
                ].map((point) => (
                  <p key={point} className="flex items-start gap-2 text-sm text-[#4b3d31]/74">
                    <Check size={16} className="mt-1 shrink-0 text-[#7a6248]" />
                    {point}
                  </p>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#products" className="inline-flex items-center gap-2 rounded-full bg-[#1f1712] px-6 py-3 text-sm font-black text-[#f7f2e9] transition hover:-translate-y-0.5">
                  Bekijk producten <ArrowRight size={17} />
                </a>
                <Link href="/okfashion" className="inline-flex items-center gap-2 rounded-full border border-[#1f1712]/14 px-6 py-3 text-sm font-black text-[#1f1712] transition hover:bg-[#1f1712]/5">
                  Naar lookbook
                </Link>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {okFashionSets.map((set) => (
                <article key={set.name} className="rounded-[1.55rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-5 shadow-[0_18px_60px_rgba(95,73,48,.08)]">
                  <p className="text-[11px] font-black uppercase tracking-[.28em] text-[#7a6248]">Product set</p>
                  <h2 className="mt-3 font-serif text-3xl leading-none tracking-[-.04em]">{set.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#4b3d31]/68">{set.text}</p>
                  <div className="mt-4 space-y-2 text-sm text-[#4b3d31]/72">
                    {set.products.map((product) => (
                      <p key={product} className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-[#7a6248]" />{product}</p>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {set.colors.map((color) => (
                      <span key={color} className="rounded-full border border-[#1f1712]/10 bg-[#f4eadc] px-3 py-1 text-xs font-black text-[#4b3d31]/76">{color}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div id="products" className="px-5 py-7 sm:px-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.30em] text-[#7a6248]">The First Edit</p>
                <h2 className="mt-3 font-serif text-4xl tracking-[-.04em] sm:text-5xl">Productlijn</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#4b3d31]/68">
                Elke kaart toont de geplande verkoopkleuren. Zodra samples en prijzen definitief zijn, kunnen deze kaarten direct worden omgezet naar koopbare producten in hetzelfde admin panel.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {okFashionProducts.map((product) => (
                <Link
                  key={product.slug}
                  href={`/okfashion/product/${product.slug}`}
                  className="group overflow-hidden rounded-[1.6rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-4 shadow-[0_18px_60px_rgba(95,73,48,.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(95,73,48,.13)]"
                >
                  <div className="rounded-[1.3rem] border border-[#1f1712]/8 bg-[linear-gradient(180deg,#f4ebdf,#e0d0ba)] p-5 transition group-hover:bg-[linear-gradient(180deg,#f7f1e8,#d9c4a6)]">
                    <OkFashionGarment kind={product.garment} tone={product.heroTone} accent={product.accent} />
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-[.24em] text-[#7a6248]">{product.category}</p>
                    <p className="rounded-full bg-[#1f1712]/5 px-3 py-1 text-[11px] font-black text-[#4b3d31]/70">{product.status}</p>
                  </div>
                  <h3 className="mt-3 font-serif text-2xl leading-none tracking-[-.04em]">{product.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#4b3d31]/66">{product.short}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <span key={color.name} className="flex items-center gap-1.5 rounded-full border border-[#1f1712]/10 bg-[#f8f1e5] px-2.5 py-1 text-[11px] font-bold text-[#4b3d31]/74">
                        <span style={{ backgroundColor: color.hex }} className="h-3.5 w-3.5 rounded-full border border-black/10" />
                        {color.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-[#1f1712]/8 pt-4">
                    <p className="text-sm font-black">{product.priceRange}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-[.18em] text-[#7a6248]">Details <ArrowRight size={14} /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
