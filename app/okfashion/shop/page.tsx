import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { getOkFashionProduct, okFashionColorStories, okFashionProducts, okFashionSets } from '@/lib/ok-fashion'

export const metadata = {
  title: 'OK Fashion Shop | ASORTA',
  description: 'De afzonderlijke OK Fashion shop binnen ASORTA met de geplande OK Fashion producten, echte visuals en verkoopkleuren.',
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
                De shop toont nu echte productafbeeldingen per item. Elke kaart is gekoppeld aan de color stories die wij daadwerkelijk willen verkopen.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  '8 kernproducten voor The First Edit.',
                  'Echte visuals per product voor de OK Fashion shop.',
                  'Kleurencombinaties afgestemd op de color stories sectie.',
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
                      <span key={color} className="rounded-full border border-[#1f1712]/10 bg-[#f4eadc] px-3 py-1 text-xs font-black uppercase tracking-[.12em] text-[#4b3d31]/76">{color}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="border-b border-[#1f1712]/10 px-5 py-6 sm:px-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.30em] text-[#7a6248]">Color story placement</p>
                <h2 className="mt-3 font-serif text-3xl tracking-[-.04em] sm:text-4xl">Producten op de juiste plek</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#4b3d31]/70">
                Per color story zie je hieronder direct welke producten daarbij horen en in welke kleurcombinatie ze verkocht worden.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
              {okFashionColorStories.map((story) => (
                <article key={story.name} className="rounded-[1.5rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-4 shadow-[0_14px_55px_rgba(95,73,48,.08)]">
                  <div className="flex gap-2">
                    {story.swatches.map((swatch) => (
                      <span key={swatch} style={{ backgroundColor: swatch }} className="h-10 flex-1 rounded-2xl border border-black/8" />
                    ))}
                  </div>
                  <h3 className="mt-4 text-xs font-black uppercase tracking-[.24em] text-[#7a6248]">{story.name}</h3>
                  <p className="mt-2 text-sm text-[#4b3d31]/66">{story.text}</p>
                  <div className="mt-4 space-y-2">
                    {story.products.map((entry) => {
                      const product = getOkFashionProduct(entry.slug)
                      if (!product) return null
                      return (
                        <Link key={entry.slug} href={`/okfashion/product/${entry.slug}`} className="flex items-center gap-3 rounded-[1.1rem] border border-[#1f1712]/8 bg-[#f7f1e7] p-2.5 transition hover:bg-[#f1e7d9]">
                          <img src={product.image} alt={product.name} className="h-16 w-14 rounded-lg object-cover" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#1f1712]">{product.name}</p>
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[.18em] text-[#7a6248]">{entry.color}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div id="products" className="px-5 py-6 sm:px-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.30em] text-[#7a6248]">All products</p>
                <h2 className="mt-3 font-serif text-3xl tracking-[-.04em] sm:text-4xl">De volledige OK Fashion productlijn</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#4b3d31]/70">
                Elke productkaart toont nu de echte productafbeelding, set, materiaal, verkoopkleuren en de color story match.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {okFashionProducts.map((product) => (
                <Link key={product.slug} href={`/okfashion/product/${product.slug}`} className="rounded-[1.5rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-4 shadow-[0_18px_60px_rgba(95,73,48,.08)] transition hover:-translate-y-1">
                  <div className="overflow-hidden rounded-[1.2rem] border border-[#1f1712]/8 bg-[#f3eadf]">
                    <img src={product.image} alt={product.name} className="aspect-[4/5] w-full object-cover" />
                  </div>
                  <p className="mt-4 text-[11px] font-black uppercase tracking-[.24em] text-[#7a6248]">{product.category}</p>
                  <h3 className="mt-2 font-serif text-2xl leading-none tracking-[-.04em]">{product.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#4b3d31]/66">{product.short}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <span key={color.name} title={color.name} style={{ backgroundColor: color.hex }} className="h-6 w-6 rounded-full border border-black/10 shadow-inner" />
                    ))}
                  </div>
                  <div className="mt-4 rounded-[1rem] border border-[#1f1712]/8 bg-[#f7f1e7] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#7a6248]">Color stories</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.storyNames.map((story) => (
                        <span key={story} className="rounded-full border border-[#1f1712]/10 bg-[#fffaf3] px-2.5 py-1 text-[11px] font-bold text-[#4b3d31]/72">{story}</span>
                      ))}
                    </div>
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
