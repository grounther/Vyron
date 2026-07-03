import Link from 'next/link'
import type React from 'react'
import { ArrowRight, Check, Leaf, Scissors, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'OK Fashion | ASORTA',
  description: 'OK Fashion is een afzonderlijke premium fashion shop van ASORTA: quiet luxury, natuurlijke materialen en subtiele branding.',
}

const colorStories = [
  { name: 'Camel + White + Navy', swatches: ['#b48a5f', '#f4efe6', '#111f35'], text: 'Klassiek, rijk en clean.' },
  { name: 'Olive + Cream', swatches: ['#5d6a50', '#f2eadc', '#d7c7ac'], text: 'Aards, rustig en verfijnd.' },
  { name: 'Chocolate + Beige', swatches: ['#3a2419', '#cbb89d', '#efe2cf'], text: 'Warm, volwassen en luxe.' },
  { name: 'Black + Grey', swatches: ['#050505', '#4c4c4c', '#d6d3cd'], text: 'Modern, strak en minimalistisch.' },
]

const sets = [
  {
    nr: '01',
    name: 'The Cotton Essential Set',
    products: ['Premium Cotton T-shirt', 'Relaxed Cotton Trouser', 'Premium Cotton Short'],
    materials: 'Compact cotton, pima/supima cotton en cotton twill.',
    colors: 'White, Stone, Black, Navy, Beige',
    mood: 'Clean everyday luxury.',
  },
  {
    nr: '02',
    name: 'The Linen Resort Set',
    products: ['Linen Shirt', 'Linen Trouser', 'Linen Short'],
    materials: 'Linnen, linnen/katoen blend en linnen/viscose blend.',
    colors: 'Cream, White, Olive, Beige, Navy',
    mood: 'Zomers, luchtig en stijlvol.',
  },
  {
    nr: '03',
    name: 'The Relaxed Tailored Set',
    products: ['Relaxed Trouser', 'Premium Cotton T-shirt', 'Overshirt'],
    materials: 'Katoen/linnen blend, zware katoen twill en premium cotton.',
    colors: 'Beige, Charcoal, Navy, Chocolate, Cream',
    mood: 'Comfort met een nette uitstraling.',
  },
  {
    nr: '04',
    name: 'The Overshirt Uniform Set',
    products: ['Overshirt', 'Structured Trouser', 'Structured Short'],
    materials: 'Katoen twill, linnen/katoen blend en brushed cotton.',
    colors: 'Olive, Chocolate, Navy, Camel, Charcoal',
    mood: 'De herkenbare OK Fashion look.',
  },
  {
    nr: '05',
    name: 'The Silk Evening Set',
    products: ['Silk-Blend Shirt', 'Fluid Trouser', 'Tailored Short'],
    materials: 'Zijde/katoen, zijde/viscose en zijde/linnen blends.',
    colors: 'Black, Chocolate, Pearl, Taupe, Beige',
    mood: 'Elegant, rustig en avondwaardig.',
  },
]

export default function OKFashionPage(){
  return <main className="ok-fashion min-h-screen bg-[#f7f1e8] text-[#191512]">
    <section className="relative overflow-hidden border-b border-[#191512]/10">
      <div className="absolute inset-0">
        <img src="/okfashion/ok-fashion-moodboard.png" alt="" className="h-full w-full object-cover opacity-32" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,241,232,.98),rgba(247,241,232,.82)_45%,rgba(247,241,232,.42)),linear-gradient(180deg,rgba(247,241,232,.52),rgba(247,241,232,.98))]" />
      </div>
      <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[.34em] text-[#7b6246]">OK Fashion</p>
          <h1 className="mt-5 max-w-3xl text-balance font-serif text-5xl leading-[.95] tracking-[-.055em] text-[#191512] sm:text-6xl md:text-8xl">The First Edit</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#40352b]/75">Kleding voor mensen die kwaliteit niet uitgelegd hoeven te krijgen. Luxe, stijlvol en modern, met natuurlijke materialen, comfortabele pasvormen en een subtiel sierlijk OK-logo op de linker mouw.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/okfashion/shop" className="inline-flex items-center gap-2 rounded-full bg-[#191512] px-6 py-3 text-sm font-black text-[#f7f1e8] transition hover:-translate-y-0.5">Bekijk collectie <ArrowRight size={17}/></Link>
            <a href="#ok-detail" className="inline-flex items-center gap-2 rounded-full border border-[#191512]/15 px-6 py-3 text-sm font-black text-[#191512] transition hover:bg-[#191512]/5">Het OK-detail</a>
          </div>
        </div>
        <div className="rounded-[2.25rem] border border-[#191512]/10 bg-[#fffaf2]/65 p-3 shadow-[0_30px_120px_rgba(78,56,35,.20)] backdrop-blur">
          <img src="/okfashion/ok-fashion-moodboard.png" alt="OK Fashion moodboard" className="h-[520px] w-full rounded-[1.65rem] object-cover" />
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-5 md:grid-cols-3">
        <Principle icon={<Leaf size={22}/>} title="Natuurlijke materialen" text="Linnen, zijdeblends en hoogwaardig katoen vormen de basis." />
        <Principle icon={<Scissors size={22}/>} title="Subtiele afwerking" text="Geen schreeuwerige logo’s. Het OK-monogram wordt klein geborduurd op de linker mouw." />
        <Principle icon={<Sparkles size={22}/>} title="Quiet luxury" text="Rustige kleuren, moderne pasvormen en een premium uitstraling zonder poespas." />
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[.30em] text-[#7b6246]">Color stories</p>
          <h2 className="mt-3 font-serif text-4xl tracking-[-.04em] sm:text-6xl">Rijke neutrale kleuren</h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-[#40352b]/65">Een palette dat luxe voelt zonder hard te worden: camel, cream, navy, olive, chocolate, beige, black en grey.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {colorStories.map((story)=><div key={story.name} className="rounded-[1.5rem] border border-[#191512]/10 bg-[#fffaf2]/70 p-5 shadow-[0_18px_70px_rgba(78,56,35,.08)]">
          <div className="flex gap-2">{story.swatches.map((s)=><span key={s} style={{backgroundColor:s}} className="h-14 flex-1 rounded-2xl border border-black/10" />)}</div>
          <h3 className="mt-5 font-serif text-2xl tracking-[-.03em]">{story.name}</h3>
          <p className="mt-2 text-sm text-[#40352b]/62">{story.text}</p>
        </div>)}
      </div>
    </section>

    <section id="collection" className="bg-[#191512] py-16 text-[#f7f1e8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[.30em] text-[#cdb895]">The First Edit</p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-.04em] sm:text-6xl">5 complete sets</h2>
          </div>
          <Link href="/okfashion/shop" className="inline-flex items-center gap-2 rounded-full bg-[#f7f1e8] px-5 py-3 text-sm font-black text-[#191512]">Open shop <ArrowRight size={17}/></Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-5">
          {sets.map((set)=><article key={set.name} className="rounded-[1.6rem] border border-white/10 bg-white/[.055] p-5 shadow-[0_22px_80px_rgba(0,0,0,.22)]">
            <p className="text-xs font-black uppercase tracking-[.28em] text-[#cdb895]">Set {set.nr}</p>
            <h3 className="mt-3 min-h-20 font-serif text-2xl leading-7 tracking-[-.03em]">{set.name}</h3>
            <p className="mt-3 text-sm leading-6 text-white/60">{set.mood}</p>
            <div className="mt-5 space-y-2 text-sm text-white/72">{set.products.map((p)=><p key={p} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#cdb895]"/> {p}</p>)}</div>
            <p className="mt-5 text-xs leading-5 text-white/42"><strong className="text-white/58">Materialen:</strong> {set.materials}</p>
            <p className="mt-2 text-xs leading-5 text-white/42"><strong className="text-white/58">Kleuren:</strong> {set.colors}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section id="ok-detail" className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[.95fr_1.05fr] lg:px-8">
      <div className="rounded-[2rem] border border-[#191512]/10 bg-[#fffaf2] p-7 shadow-[0_24px_100px_rgba(78,56,35,.10)]">
        <p className="text-xs font-black uppercase tracking-[.30em] text-[#7b6246]">The OK detail</p>
        <h2 className="mt-3 font-serif text-4xl leading-none tracking-[-.04em] sm:text-6xl">Subtiel op de linker mouw</h2>
        <p className="mt-5 text-sm leading-7 text-[#40352b]/72">Elk bovenstuk krijgt een klein sierlijk OK-monogram op de linker mouwnaad. Bij voorkeur ton-sur-ton, zodat het logo luxe en ingetogen blijft.</p>
        <ul className="mt-6 grid gap-3 text-sm text-[#40352b]/70">
          <li>Logoformaat: ongeveer 1,5 tot 2,2 cm breed.</li>
          <li>Borduring: ton-sur-ton of laag contrast.</li>
          <li>Uitstraling: sierlijk, premium en niet sportief.</li>
        </ul>
      </div>
      <div className="relative overflow-hidden rounded-[2rem] bg-[#d8c5a9] p-8 shadow-[0_24px_100px_rgba(78,56,35,.16)]">
        <div className="absolute inset-0 opacity-35 [background:radial-gradient(circle_at_70%_20%,#fff,transparent_35%),linear-gradient(135deg,#e8d8bf,#a78663)]" />
        <div className="relative mx-auto grid h-full min-h-[360px] max-w-lg place-items-center rounded-[1.6rem] border border-[#191512]/10 bg-[#f7f1e8]/84 p-8 text-center">
          <div>
            <div className="mx-auto grid h-32 w-32 place-items-center rounded-full border border-[#191512]/15 bg-[#fffaf2] font-serif text-6xl italic tracking-[-.18em] text-[#2a211a] shadow-inner">OK</div>
            <p className="mt-6 text-xs font-black uppercase tracking-[.28em] text-[#7b6246]">Geborduurd monogram</p>
            <p className="mt-2 text-sm text-[#40352b]/65">Linker mouwnaad · ton-sur-ton · bewust ingetogen</p>
          </div>
        </div>
      </div>
    </section>
  </main>
}

function Principle({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){
  return <div className="rounded-[1.6rem] border border-[#191512]/10 bg-[#fffaf2]/70 p-6 shadow-[0_18px_70px_rgba(78,56,35,.08)]">
    <div className="grid h-11 w-11 place-items-center rounded-full bg-[#191512] text-[#f7f1e8]">{icon}</div>
    <h3 className="mt-5 font-serif text-2xl tracking-[-.03em]">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-[#40352b]/65">{text}</p>
  </div>
}
