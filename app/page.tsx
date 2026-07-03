import Link from 'next/link'
import { ArrowRight, BadgeCheck, Layers3, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'ASORTA | Kies je wereld',
  description: 'Kies tussen ASORTA Trading Card Game en OK Fashion.',
}

export default function HomeChoicePage(){
  return <main className="choice-home min-h-[calc(100vh-4rem)] overflow-hidden">
    <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-[-12%] h-80 w-80 rounded-full bg-[#b7c8ad]/10 blur-3xl" />
        <div className="absolute bottom-[-8%] right-[-8%] h-96 w-96 rounded-full bg-[#b58b5b]/12 blur-3xl" />
      </div>

      <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
        <p className="kicker">ASORTA</p>
        <h1 className="mt-3 text-balance text-4xl font-black tracking-[-.04em] text-white sm:text-5xl md:text-7xl">Kies je wereld</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/58 sm:text-base sm:leading-7">Trading Card Game en OK Fashion blijven twee eigen werelden, met één centraal ASORTA-platform en één gedeeld admin panel.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChoiceCard
          href="/tcg"
          eyebrow="Trading Card Game"
          title="ASORTA TCG"
          text="Sealed producten, singles, accessories, markten en collectibles. De vertrouwde ASORTA TCG shop gaat verder onder een eigen route."
          image="/asorta-tcg-hero.jpeg"
          cta="Naar TCG"
          tone="tcg"
        />
        <ChoiceCard
          href="/okfashion"
          eyebrow="Quiet luxury kleding"
          title="OK Fashion"
          text="Een afzonderlijke premium fashion shop met natuurlijke materialen, rustige luxe, comfortabele pasvormen en het subtiele OK-logo op de linker mouw."
          image="/okfashion/ok-fashion-moodboard.png"
          cta="Naar OK Fashion"
          tone="fashion"
        />
      </div>

      <div className="mt-7 grid gap-3 text-sm text-white/48 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><BadgeCheck size={18} className="mb-2 text-white/60"/> Eén domein, twee shops</div>
        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><Layers3 size={18} className="mb-2 text-white/60"/> Gedeeld admin panel</div>
        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><Sparkles size={18} className="mb-2 text-white/60"/> Eigen uitstraling per merk</div>
      </div>
    </section>
  </main>
}

function ChoiceCard({href, eyebrow, title, text, image, cta, tone}:{href:string; eyebrow:string; title:string; text:string; image:string; cta:string; tone:'tcg'|'fashion'}){
  return <Link href={href} className={`choice-card group relative min-h-[32rem] overflow-hidden rounded-[2rem] border border-white/12 bg-black shadow-[0_28px_120px_rgba(0,0,0,.42)] transition duration-300 hover:-translate-y-1 hover:border-white/28 ${tone === 'fashion' ? 'choice-card-fashion' : 'choice-card-tcg'}`}>
    <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-62 transition duration-700 group-hover:scale-105 group-hover:opacity-76" />
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.72)_58%,rgba(0,0,0,.92)),linear-gradient(90deg,rgba(0,0,0,.55),rgba(0,0,0,.10))]" />
    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/[.08] to-transparent" />
    <div className="relative z-10 flex h-full min-h-[32rem] flex-col justify-end p-6 sm:p-8 md:p-10">
      <p className="text-xs font-black uppercase tracking-[.28em] text-white/54">{eyebrow}</p>
      <h2 className="mt-3 text-4xl font-black tracking-[-.04em] text-white sm:text-5xl">{title}</h2>
      <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7">{text}</p>
      <span className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-black shadow-[0_18px_60px_rgba(255,255,255,.18)] transition group-hover:translate-x-1">{cta}<ArrowRight size={17}/></span>
    </div>
  </Link>
}
