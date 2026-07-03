import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { ArrowRight, Leaf, Scissors, Sparkles } from 'lucide-react'
import OkFashionGarment from '@/components/OkFashionGarment'
import { okFashionProducts } from '@/lib/ok-fashion'

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

const colorStories = [
  {
    name: 'CAMEL + WHITE + NAVY',
    text: 'Klassiek, rijk en clean.',
    swatches: ['#b58b61', '#f4efe6', '#16233a'],
    outfit: ['#b58b61', '#f4efe6', '#16233a'],
  },
  {
    name: 'OLIVE + CREAM',
    text: 'Aards, rustig en verfijnd.',
    swatches: ['#667255', '#f2e9da', '#d9cab1'],
    outfit: ['#667255', '#f2e9da', '#2d251f'],
  },
  {
    name: 'CHOCOLATE + BEIGE',
    text: 'Warm, volwassen en luxe.',
    swatches: ['#3c271c', '#cdb89f', '#f0e3cf'],
    outfit: ['#3c271c', '#cdb89f', '#8f6545'],
  },
  {
    name: 'BLACK + GREY',
    text: 'Modern, strak en minimalistisch.',
    swatches: ['#090909', '#505050', '#d8d5cf'],
    outfit: ['#3d4045', '#090909', '#181818'],
  },
]

const essentialPieces = [
  {
    title: 'Premium Cotton T-shirt',
    note: 'Soft touch. Perfect drape. Everyday luxury.',
    tone: '#f1e4d1',
    accent: '#d1b188',
    kind: 'tee' as const,
  },
  {
    title: 'Linen Shirt',
    note: 'Breathable and effortless. Naturally refined.',
    tone: '#eee1cb',
    accent: '#cab28f',
    kind: 'shirt' as const,
  },
  {
    title: 'Relaxed Trouser',
    note: 'Fluid silhouette. All-day comfort with elegance.',
    tone: '#eadfcf',
    accent: '#ba9f7c',
    kind: 'trouser' as const,
  },
  {
    title: 'Overshirt',
    note: 'Versatile layering piece. Light yet structured.',
    tone: '#d6d2bb',
    accent: '#6b7054',
    kind: 'overshirt' as const,
  },
  {
    title: 'Silk-Blend Shirt',
    note: 'Subtle sheen. Elevated texture and feel.',
    tone: '#dfd2c1',
    accent: '#8e715f',
    kind: 'silk' as const,
  },
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
                Een luxe kleurenpalet waarin camel, olive, chocolate, navy en greys telkens terugkomen in
                rustige, volwassen combinaties.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-4">
              {colorStories.map((story) => (
                <ColorStoryCard key={story.name} {...story} />
              ))}
            </div>
          </div>

          <div id="first-edit" className="grid gap-6 px-5 py-6 sm:px-8 xl:grid-cols-[220px_minmax(0,1fr)_285px]">
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
                {essentialPieces.map((piece) => (
                  <EssentialPieceCard key={piece.title} {...piece} />
                ))}
              </div>
            </section>

            <aside id="ok-detail" className="rounded-[1.6rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-5 shadow-[0_18px_60px_rgba(95,73,48,.08)]">
              <p className="text-xs font-black uppercase tracking-[.30em] text-[#7a6248]">The OK detail</p>
              <h3 className="mt-4 font-serif text-3xl leading-none tracking-[-.04em]">Subtle by design</h3>
              <p className="mt-4 text-sm leading-6 text-[#4b3d31]/70">
                Recognizable by those who appreciate it. Elk bovenstuk krijgt een klein sierlijk OK-monogram
                op de linker mouwnaad.
              </p>
              <div className="mt-5 rounded-[1.35rem] border border-[#1f1712]/10 bg-[linear-gradient(135deg,#faf5ec,#e0ccad)] p-5">
                <div className="rounded-[1.2rem] border border-[#1f1712]/10 bg-[#f8f1e5] p-5 shadow-inner">
                  <div className="relative mx-auto h-40 max-w-[170px] rounded-[1.2rem] bg-[linear-gradient(180deg,#f4ebdf,#dfcfb7)]">
                    <div className="absolute bottom-6 right-4 text-lg font-serif italic tracking-[-.18em] text-[#3a2b1f]">
                      OK
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 h-12 rounded-b-[1.2rem] border-t border-[#1f1712]/8 bg-[#eadcc8]" />
                  </div>
                </div>
              </div>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-[#4b3d31]/70">
                <li>Monogram op de linker mouwnaad.</li>
                <li>Logoformaat circa 1,5–2,2 cm breed.</li>
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
                <div className="rounded-[1.2rem] border border-[#1f1712]/8 bg-[linear-gradient(180deg,#f4ebdf,#e0d0ba)] p-4">
                  <OkFashionGarment kind={product.garment} tone={product.heroTone} accent={product.accent} />
                </div>
                <p className="mt-4 text-[11px] font-black uppercase tracking-[.24em] text-[#7a6248]">{product.category}</p>
                <h3 className="mt-2 font-serif text-2xl leading-none tracking-[-.04em]">{product.name}</h3>
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

function ColorStoryCard({
  name,
  text,
  swatches,
  outfit,
}: {
  name: string
  text: string
  swatches: string[]
  outfit: string[]
}) {
  return (
    <article className="rounded-[1.5rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-4 shadow-[0_14px_55px_rgba(95,73,48,.08)]">
      <div className="flex gap-2">
        {swatches.map((swatch) => (
          <span
            key={swatch}
            style={{ backgroundColor: swatch }}
            className="h-12 flex-1 rounded-2xl border border-black/8"
          />
        ))}
      </div>
      <h3 className="mt-4 text-xs font-black uppercase tracking-[.24em] text-[#7a6248]">{name}</h3>
      <p className="mt-2 text-sm text-[#4b3d31]/66">{text}</p>
      <OutfitFlatlay colors={outfit} />
    </article>
  )
}

function OutfitFlatlay({ colors }: { colors: string[] }) {
  return (
    <div className="mt-4 rounded-[1.25rem] border border-[#1f1712]/8 bg-[#f6efe3] p-4">
      <div className="relative mx-auto h-28 max-w-[180px]">
        <div
          style={{ backgroundColor: colors[0] }}
          className="absolute left-1/2 top-0 h-14 w-16 -translate-x-1/2 rounded-t-[1rem] rounded-b-[.7rem] shadow-sm"
        />
        <div
          style={{ backgroundColor: colors[1] }}
          className="absolute bottom-0 left-[45%] h-16 w-6 -translate-x-1/2 rounded-b-[.7rem]"
        />
        <div
          style={{ backgroundColor: colors[1] }}
          className="absolute bottom-0 left-[58%] h-16 w-6 -translate-x-1/2 rounded-b-[.7rem]"
        />
        <div
          style={{ backgroundColor: colors[2] }}
          className="absolute right-0 top-3 h-10 w-12 rounded-[.9rem] shadow-sm"
        />
        <div className="absolute bottom-1 left-[43%] h-3 w-4 rounded-full bg-[#7f5f45] opacity-70" />
        <div className="absolute bottom-1 left-[57%] h-3 w-4 rounded-full bg-[#7f5f45] opacity-70" />
      </div>
    </div>
  )
}

function EssentialPieceCard({
  title,
  note,
  tone,
  accent,
  kind,
}: {
  title: string
  note: string
  tone: string
  accent: string
  kind: 'tee' | 'shirt' | 'trouser' | 'overshirt' | 'silk'
}) {
  return (
    <article className="rounded-[1.4rem] border border-[#1f1712]/10 bg-[#fcf8f1] p-4 shadow-[0_12px_50px_rgba(95,73,48,.08)]">
      <p className="min-h-10 text-[11px] font-black uppercase leading-4 tracking-[.20em] text-[#7a6248]">{title}</p>
      <div className="mt-3 rounded-[1.2rem] border border-[#1f1712]/8 bg-[#f3ebde] p-4">
        <GarmentFigure kind={kind} tone={tone} accent={accent} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#4b3d31]/66">{note}</p>
    </article>
  )
}

function GarmentFigure({
  kind,
  tone,
  accent,
}: {
  kind: 'tee' | 'shirt' | 'trouser' | 'overshirt' | 'silk'
  tone: string
  accent: string
}) {
  if (kind === 'trouser') {
    return (
      <div className="mx-auto h-[170px] max-w-[120px]">
        <div className="relative mx-auto h-full w-[78px]">
          <div style={{ backgroundColor: tone }} className="absolute left-1/2 top-0 h-5 w-16 -translate-x-1/2 rounded-t-xl" />
          <div style={{ backgroundColor: tone }} className="absolute left-[14px] top-3 h-[140px] w-10 -skew-x-6 rounded-b-[1.2rem]" />
          <div style={{ backgroundColor: tone }} className="absolute right-[14px] top-3 h-[140px] w-10 skew-x-6 rounded-b-[1.2rem]" />
          <div style={{ backgroundColor: accent }} className="absolute left-1/2 top-2 h-1 w-8 -translate-x-1/2 rounded-full opacity-75" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto h-[170px] max-w-[130px]">
      <div className="relative mx-auto h-full w-[108px]">
        <div style={{ backgroundColor: tone }} className="absolute left-1/2 top-0 h-10 w-10 -translate-x-1/2 rounded-full" />
        <div style={{ backgroundColor: tone }} className="absolute left-[10px] top-[20px] h-4 w-10 -rotate-[28deg] rounded-full" />
        <div style={{ backgroundColor: tone }} className="absolute right-[10px] top-[20px] h-4 w-10 rotate-[28deg] rounded-full" />
        <div style={{ backgroundColor: tone }} className="absolute left-1/2 top-[18px] h-[118px] w-[76px] -translate-x-1/2 rounded-[1.2rem]" />
        {(kind === 'shirt' || kind === 'overshirt' || kind === 'silk') && (
          <div className="absolute left-1/2 top-[26px] h-[98px] w-px -translate-x-1/2 bg-[#1f1712]/15" />
        )}
        {(kind === 'shirt' || kind === 'overshirt' || kind === 'silk') && (
          <div className="absolute left-1/2 top-[18px] h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-[#1f1712]/12" />
        )}
        {kind === 'overshirt' && (
          <>
            <div className="absolute left-[24px] top-[46px] h-5 w-5 rounded-md border border-[#1f1712]/10 bg-[#f8f1e5]/28" />
            <div className="absolute right-[24px] top-[46px] h-5 w-5 rounded-md border border-[#1f1712]/10 bg-[#f8f1e5]/28" />
          </>
        )}
        <div style={{ backgroundColor: accent }} className="absolute left-[76px] top-[72px] h-[10px] w-[16px] rounded-full opacity-85" />
        <div className="absolute left-[79px] top-[70px] font-serif text-[10px] italic tracking-[-.18em] text-[#3d2c20]">OK</div>
      </div>
    </div>
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
