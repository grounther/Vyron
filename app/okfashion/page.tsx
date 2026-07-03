import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { ArrowRight, Leaf, Scissors, Sparkles } from 'lucide-react'
import { getOkFashionProduct, okFashionColorStories, okFashionProducts } from '@/lib/ok-fashion'

export const metadata = {
  title: 'OK Fashion | ASORTA',
  description: 'OK Fashion is een afzonderlijke premium fashion shop van ASORTA: quiet luxury, natuurlijke materialen en subtiele branding.',
}

const editorialShots = [
  { title: 'Camel tailoring', position: '68% 16%' },
  { title: 'Olive linen', position: '80% 16%' },
  { title: 'Chocolate layers', position: '68% 34%' },
  { title: 'Black & grey', position: '81% 34%' },
]

const essentialProductSlugs = [
  'premium-cotton-t-shirt',
  'linen-shirt',
  'relaxed-cotton-trouser',
  'overshirt',
  'silk-blend-shirt',
]

const principles = [
  {
    icon: <Leaf size={20} />,
    title: 'Natuurlijke materialen',
    text: 'Linnen, zijdeblends en hoogwaardig katoen vormen de basis van de collectie.',
  },
  {
    icon: <Scissors size={20} />,
    title: 'Subtiele afwerking',
    text: 'Geen schreeuwerige branding. Alleen een klein sierlijk OK-logo op de linker mouw.',
  },
  {
    icon: <Sparkles size={20} />,
    title: 'Quiet luxury',
    text: 'Rustige kleuren, moderne pasvormen en kleding die kwaliteit laat voelen in elk detail.',
  },
]

const essentialProducts = essentialProductSlugs
  .map((slug) => getOkFashionProduct(slug))
  .filter((product): product is NonNullable<ReturnType<typeof getOkFashionProduct>> => Boolean(product))

export default function OKFashionPage() {
  return (
    <main className="ok-fashion min-h-screen bg-[#f3ecdf] px-4 py-6 text-[#1f1712] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <section className="overflow-hidden rounded-[2rem] border border-[#1f1712]/10 bg-[#f7f2e9] shadow-[0_35px_120px_rgba(95,73,48,.16)]">
          <div className="border-b border-[#1f1712]/10 px-5 py-5 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[.84fr_1.16fr] lg:items-start">
              <div className="pt-2">
                <p className="text-xs font-black uppercase tracking-[.34em] text-[#7a6248]">OK Fashion</p>
                <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[.9] tracking-[-.06em] sm:text-6xl lg:text-7xl">
                  The First Edit
                </h1>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[.28em] text-[#7a6248]">
                  Timeless style. Refined simplicity.
                </p>
                <div className="mt-5 h-px w-28 bg-[#1f1712]/14" />
                <p className="mt-6 max-w-xl text-sm leading-7 text-[#4b3d31]/78 sm:text-base">
                  A collection built on quiet luxury and considered craftsmanship. Elevated neutrals,
                  natural fabrics and modern silhouettes for people who value quality in every detail.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/okfashion/shop"
                    className="inline-flex items-center gap-2 rounded-full bg-[#1f1712] px-6 py-3 text-sm font-black text-[#f7f2e9] transition hover:-translate-y-0.5"
                  >
                    Open shop <ArrowRight size={17} />
                  </Link>
                  <a
                    href="#first-edit"
                    className="inline-flex items-center gap-2 rounded-full border border-[#1f1712]/14 px-6 py-3 text-sm font-black text-[#1f1712] transition hover:bg-[#1f1712]/5"
                  >
                    Bekijk collectie
                  </a>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {editorialShots.map((shot) => (
                  <EditorialCrop key={shot.title} title={shot.title} position={shot.position} />
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-[#1f1712]/10 px-5 py-6 sm:px-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.30em] text-[#7a6248]">Color stories</p>
                <h2 className="mt-3 font-serif text-3xl tracking-[-.04em] sm:text-4xl">Timeless elegance in neutral tones</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#4b3d31]/70">
                De kleurencombinaties hieronder zijn nu direct gekoppeld aan de echte OK Fashion producten die je op de site ziet.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
              {okFashionColorStories.map((story) => (
                <ColorStoryCard key={story.name} story={story} />
              ))}
            </div>
          </div>

          <div className="border-b border-[#1f1712]/10 px-5 py-6 sm:px-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.30em] text-[#7a6248]">Lookbook sets</p>
                <h2 className="mt-3 font-serif text-3xl tracking-[-.04em] sm:text-4xl">Complete looks met model styling</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#4b3d31]/70">
                De sets gebruiken de rustige mannelijke model-sfeer uit het OK Fashion moodboard en tonen direct welke producten samen verkocht worden.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-4">
              <LookbookSetCard
                title="The Cotton Essential Set"
                subtitle="White + Beige"
                position="76% 18%"
                products={["premium-cotton-t-shirt", "relaxed-cotton-trouser"]}
              />
              <LookbookSetCard
                title="The Linen Resort Set"
                subtitle="Olive + Cream"
                position="82% 17%"
                products={["linen-shirt", "linen-trouser", "linen-short"]}
              />
              <LookbookSetCard
                title="The Overshirt Uniform Set"
                subtitle="Olive + Cream / Chocolate + Beige"
                position="70% 34%"
                products={["overshirt", "premium-cotton-t-shirt", "relaxed-cotton-trouser"]}
              />
              <LookbookSetCard
                title="The Silk Evening Set"
                subtitle="Black + Grey"
                position="82% 35%"
                products={["silk-blend-shirt", "fluid-trouser"]}
              />
            </div>
          </div>

          <div id="first-edit" className="grid gap-6 px-5 py-6 sm:px-8 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
            <aside className="rounded-[1.6rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-5 shadow-[0_18px_60px_rgba(95,73,48,.08)]">
              <p className="text-xs font-black uppercase tracking-[.30em] text-[#7a6248]">Key materials</p>
              <div className="mt-5 grid h-11 w-11 place-items-center rounded-full border border-[#1f1712]/10 bg-[#f5ede0] text-[#1f1712]">
                <Leaf size={18} />
              </div>
              <div className="mt-5 space-y-4 font-serif text-2xl tracking-[-.03em]">
                <p>Linen</p>
                <p>Silk</p>
                <p>Cotton</p>
              </div>
              <p className="mt-6 text-sm leading-6 text-[#4b3d31]/68">Natural. Breathable. Timeless.</p>
            </aside>

            <section>
              <div className="mb-5">
                <p className="text-xs font-black uppercase tracking-[.30em] text-[#7a6248]">The first collection</p>
                <h2 className="mt-3 font-serif text-3xl tracking-[-.04em] sm:text-4xl">5 essential pieces</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {essentialProducts.map((product) => (
                  <EssentialPieceCard key={product.slug} product={product} />
                ))}
              </div>
            </section>

            <aside id="ok-detail" className="rounded-[1.6rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-5 shadow-[0_18px_60px_rgba(95,73,48,.08)]">
              <p className="text-xs font-black uppercase tracking-[.30em] text-[#7a6248]">The OK detail</p>
              <h3 className="mt-4 font-serif text-3xl leading-none tracking-[-.04em]">Subtle by design</h3>
              <p className="mt-4 text-sm leading-6 text-[#4b3d31]/70">
                Bij shirts, blouses en overshirts staat het sierlijke OK-logo helemaal onderaan, aan de binnenkant van de linker omgeslagen manchet.
                Bij T-shirts blijft het logo subtiel op het einde van de linker mouw.
              </p>
              <div className="mt-5 overflow-hidden rounded-[1.35rem] border border-[#1f1712]/10 bg-[#f8f1e5]">
                <img src="/okfashion/products/linen-shirt.png" alt="OK Fashion linen shirt detail" className="h-auto w-full object-cover" />
              </div>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-[#4b3d31]/70">
                <li>Shirts en overshirts: logo aan de binnenkant van de omgeslagen linker manchet.</li>
                <li>T-shirts: logo op het einde van de linker mouw.</li>
                <li>Ton-sur-ton of laag contrast voor een luxe uitstraling.</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {principles.map((principle) => (
            <PrincipleCard key={principle.title} icon={principle.icon} title={principle.title} text={principle.text} />
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-[#1f1712]/10 bg-[#f7f2e9] p-5 shadow-[0_35px_120px_rgba(95,73,48,.12)] sm:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.30em] text-[#7a6248]">Werkelijke productlijn</p>
              <h2 className="mt-3 font-serif text-4xl tracking-[-.04em] sm:text-5xl">Producten en kleuren die wij gaan verkopen</h2>
            </div>
            <Link href="/okfashion/shop" className="inline-flex items-center gap-2 rounded-full bg-[#1f1712] px-6 py-3 text-sm font-black text-[#f7f2e9] transition hover:-translate-y-0.5">
              Open volledige shop <ArrowRight size={17} />
            </Link>
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
                  {product.colors.slice(0, 5).map((color) => (
                    <span key={color.name} title={color.name} style={{ backgroundColor: color.hex }} className="h-6 w-6 rounded-full border border-black/10 shadow-inner" />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function EditorialCrop({ title, position }: { title: string; position: string }) {
  const style = {
    backgroundImage: "linear-gradient(180deg, rgba(32,23,18,.05), rgba(32,23,18,.25)), url('/okfashion/ok-fashion-moodboard.png')",
    backgroundPosition: position,
    backgroundSize: '215%',
  } satisfies CSSProperties

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[#1f1712]/10 bg-[#f6efe3] shadow-[0_18px_60px_rgba(95,73,48,.10)]">
      <div style={style} className="aspect-[5/6] w-full" />
      <div className="border-t border-[#1f1712]/8 px-4 py-3">
        <p className="text-[11px] font-black uppercase tracking-[.24em] text-[#7a6248]">Editorial look</p>
        <p className="mt-1 font-serif text-xl tracking-[-.03em]">{title}</p>
      </div>
    </div>
  )
}

function ColorStoryCard({ story }: { story: (typeof okFashionColorStories)[number] }) {
  return (
    <article className="rounded-[1.5rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-4 shadow-[0_14px_55px_rgba(95,73,48,.08)]">
      <div className="flex gap-2">
        {story.swatches.map((swatch) => (
          <span key={swatch} style={{ backgroundColor: swatch }} className="h-12 flex-1 rounded-2xl border border-black/8" />
        ))}
      </div>
      <h3 className="mt-4 text-xs font-black uppercase tracking-[.24em] text-[#7a6248]">{story.name}</h3>
      <p className="mt-2 text-sm text-[#4b3d31]/66">{story.text}</p>
      <div className="mt-4 space-y-3">
        {story.products.map((entry) => {
          const product = getOkFashionProduct(entry.slug)
          if (!product) return null
          return (
            <Link key={entry.slug} href={`/okfashion/product/${entry.slug}`} className="flex items-center gap-3 rounded-[1.2rem] border border-[#1f1712]/8 bg-[#f7f1e7] p-3 transition hover:bg-[#f1e7d9]">
              <img src={product.image} alt={product.name} className="h-20 w-16 rounded-xl object-cover" />
              <div className="min-w-0">
                <p className="truncate font-serif text-lg leading-none tracking-[-.03em]">{product.name}</p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[.24em] text-[#7a6248]">{entry.color}</p>
                <div className="mt-2 flex gap-1.5">
                  {product.colors.slice(0, 3).map((color) => (
                    <span key={color.name} style={{ backgroundColor: color.hex }} className="h-4 w-4 rounded-full border border-black/10" />
                  ))}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </article>
  )
}

function EssentialPieceCard({ product }: { product: NonNullable<ReturnType<typeof getOkFashionProduct>> }) {
  return (
    <article className="rounded-[1.4rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-4 shadow-[0_12px_50px_rgba(95,73,48,.08)]">
      <p className="min-h-10 text-[11px] font-black uppercase leading-4 tracking-[.20em] text-[#7a6248]">{product.name}</p>
      <div className="mt-3 overflow-hidden rounded-[1.2rem] border border-[#1f1712]/8 bg-[#f3ebde]">
        <img src={product.image} alt={product.name} className="aspect-[4/5] w-full object-cover" />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#4b3d31]/66">{product.short}</p>
    </article>
  )
}

function LookbookSetCard({ title, subtitle, position, products }: { title: string; subtitle: string; position: string; products: string[] }) {
  const style = {
    backgroundImage: "linear-gradient(180deg, rgba(31,23,18,.08), rgba(31,23,18,.58)), url('/okfashion/ok-fashion-moodboard.png')",
    backgroundPosition: position,
    backgroundSize: '240%',
  } satisfies CSSProperties

  return (
    <article className="overflow-hidden rounded-[1.6rem] border border-[#1f1712]/10 bg-[#fcf8f1] shadow-[0_18px_60px_rgba(95,73,48,.10)]">
      <div style={style} className="relative min-h-[310px] p-4">
        <div className="absolute inset-x-4 bottom-4 rounded-[1.2rem] border border-white/15 bg-[#1f1712]/58 p-4 text-[#f7f2e9] backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#e6d2b7]">{subtitle}</p>
          <h3 className="mt-2 font-serif text-2xl leading-none tracking-[-.04em]">{title}</h3>
        </div>
      </div>
      <div className="grid gap-2 p-4">
        {products.map((slug) => {
          const product = getOkFashionProduct(slug)
          if (!product) return null
          return (
            <Link key={slug} href={`/okfashion/product/${slug}`} className="flex items-center gap-3 rounded-[1.05rem] border border-[#1f1712]/8 bg-[#f7f1e7] p-2.5 transition hover:bg-[#f1e7d9]">
              <img src={product.image} alt={product.name} className="h-14 w-12 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#1f1712]">{product.name}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[.18em] text-[#7a6248]">{product.category}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </article>
  )
}

function PrincipleCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode
  title: string
  text: string
}) {
  return (
    <div className="rounded-[1.6rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-6 shadow-[0_18px_60px_rgba(95,73,48,.08)]">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-[#1f1712] text-[#f3ecdf]">{icon}</div>
      <h3 className="mt-4 font-serif text-2xl tracking-[-.03em]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#4b3d31]/68">{text}</p>
    </div>
  )
}
