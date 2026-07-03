import Link from 'next/link'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { ArrowLeft, Check, Ruler, Shirt, Sparkles } from 'lucide-react'
import { getOkFashionProduct, okFashionColorStories, okFashionProducts } from '@/lib/ok-fashion'
import OkFashionColorSelector from '@/components/OkFashionColorSelector'

export function generateStaticParams() {
  return okFashionProducts.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getOkFashionProduct(slug)
  if (!product) return { title: 'OK Fashion product | ASORTA' }
  return {
    title: `${product.name} | OK Fashion`,
    description: product.short,
  }
}

export default async function OKFashionProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = getOkFashionProduct(slug)
  if (!product) return notFound()

  const relatedStories = okFashionColorStories.filter((story) => product.storyNames.includes(story.name))

  return (
    <main className="ok-fashion min-h-screen bg-[#f3ecdf] px-4 py-6 text-[#1f1712] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link href="/okfashion/shop" className="inline-flex items-center gap-2 rounded-full border border-[#1f1712]/12 bg-[#fcf8f1] px-5 py-3 text-sm font-black text-[#1f1712]/76 transition hover:bg-[#f5eadb]">
          <ArrowLeft size={16} /> Terug naar OK Fashion shop
        </Link>

        <section className="grid overflow-hidden rounded-[2rem] border border-[#1f1712]/10 bg-[#f7f2e9] shadow-[0_35px_120px_rgba(95,73,48,.16)] lg:grid-cols-[1.05fr_.95fr]">
          <div className="grid min-h-[620px] place-items-center border-b border-[#1f1712]/10 bg-[radial-gradient(circle_at_70%_20%,#fff7ec,transparent_34%),linear-gradient(180deg,#f5ecdf,#ddc6a7)] p-8 lg:border-b-0 lg:border-r">
            <OkFashionColorSelector
              image={product.image}
              name={product.name}
              colors={product.colors}
              logoText={product.garment === 'tee'
                ? 'Klein sierlijk OK-monogram op het einde van de linker mouw.'
                : 'Klein sierlijk OK-monogram onderaan aan de binnenkant van de omgeslagen linker manchet.'}
            />
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-black uppercase tracking-[.34em] text-[#7a6248]">{product.set}</p>
            <h1 className="mt-4 font-serif text-5xl leading-[.9] tracking-[-.06em] sm:text-6xl">{product.name}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#4b3d31]/78">{product.description}</p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <InfoPill label="Materiaal" value={product.material} />
              <InfoPill label="Pasvorm" value={product.fit} />
              <InfoPill label="Prijsrichting" value={product.priceRange} />
            </div>

            <div className="mt-8">
              <p className="text-xs font-black uppercase tracking-[.28em] text-[#7a6248]">Verkoopkleuren</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {product.colors.map((color) => (
                  <div key={color.name} className="flex items-center gap-3 rounded-2xl border border-[#1f1712]/10 bg-[#fcf8f1] p-3">
                    <span style={{ backgroundColor: color.hex }} className="h-10 w-10 rounded-full border border-black/10 shadow-inner" />
                    <div>
                      <p className="font-black">{color.name}</p>
                      <p className="text-xs text-[#4b3d31]/55">Geplande kleurvariant</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-5">
              <p className="text-xs font-black uppercase tracking-[.28em] text-[#7a6248]">Color story match</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.storyNames.map((story) => (
                  <span key={story} className="rounded-full border border-[#1f1712]/10 bg-[#f7f1e7] px-3 py-1 text-sm font-bold text-[#4b3d31]/76">{story}</span>
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-[#4b3d31]/70">
                Dit product is op de site direct gekoppeld aan deze color stories, zodat de productafbeelding op de juiste plek binnen de collectie staat.
              </p>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-5">
              <p className="text-xs font-black uppercase tracking-[.28em] text-[#7a6248]">Status</p>
              <h2 className="mt-2 font-serif text-3xl tracking-[-.04em]">{product.status}</h2>
              <p className="mt-3 text-sm leading-6 text-[#4b3d31]/70">
                Dit product staat als OK Fashion productconcept klaar. Na samplegoedkeuring kunnen voorraad, definitieve prijs, maten en checkout direct gekoppeld worden via het bestaande admin panel.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <DetailCard icon={<Sparkles size={20} />} title="Belangrijkste kenmerken" items={product.features} />
          <DetailCard icon={<Ruler size={20} />} title="Specificaties" items={product.specs} />
          <DetailCard icon={<Shirt size={20} />} title="Combineert met" items={product.pairsWith} />
        </section>

        <section className="rounded-[1.8rem] border border-[#1f1712]/10 bg-[#f7f2e9] p-5 shadow-[0_18px_60px_rgba(95,73,48,.08)] sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.28em] text-[#7a6248]">Gerelateerde color stories</p>
              <h2 className="mt-2 font-serif text-3xl tracking-[-.04em]">Waar dit product op de site terugkomt</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {relatedStories.map((story) => (
              <article key={story.name} className="rounded-[1.4rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-4">
                <div className="flex gap-2">
                  {story.swatches.map((swatch) => (
                    <span key={swatch} style={{ backgroundColor: swatch }} className="h-9 flex-1 rounded-xl border border-black/8" />
                  ))}
                </div>
                <h3 className="mt-4 font-serif text-2xl tracking-[-.03em]">{story.shortName}</h3>
                <p className="mt-2 text-sm leading-6 text-[#4b3d31]/70">{story.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.3rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-4">
      <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#7a6248]">{label}</p>
      <p className="mt-2 text-sm font-bold leading-5 text-[#4b3d31]/78">{value}</p>
    </div>
  )
}

function DetailCard({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  return (
    <article className="rounded-[1.6rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-6 shadow-[0_18px_60px_rgba(95,73,48,.08)]">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-[#1f1712] text-[#f3ecdf]">{icon}</div>
      <h3 className="mt-4 font-serif text-2xl tracking-[-.03em]">{title}</h3>
      <div className="mt-4 grid gap-3 text-sm leading-6 text-[#4b3d31]/70">
        {items.map((item) => (
          <p key={item} className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-[#7a6248]" />{item}</p>
        ))}
      </div>
    </article>
  )
}
