import Link from 'next/link'
import { BadgeCheck, PackageCheck, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { getSiteContent, splitParagraphs } from '@/lib/site-content'

export const metadata = {
  title: 'Over ASORTA | Smart utility producten',
  description: 'Lees meer over ASORTA: een Nederlandse webshop voor praktische smart utility, automotive, desk setup en everyday carry producten.',
}

const values = [
  { icon: PackageCheck, title: 'Curated products', text: 'We selecteren praktische producten op bruikbaarheid, uitstraling en duidelijke informatie.' },
  { icon: ShieldCheck, title: 'Veilige checkout', text: 'Bestellen verloopt via een beveiligde betaalomgeving.' },
  { icon: Truck, title: 'Tracking-first', text: 'Je ontvangt tracking zodra je pakket is aangemeld voor verzending.' },
]

export default async function AboutPage() {
  const content = await getSiteContent()
  const paragraphs = splitParagraphs(content['about.body'])

  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-5 md:py-14">
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(111,125,100,.18),transparent_38%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
      <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">ASORTA</p>
      <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">{content['about.title'] || 'Over ASORTA'}</h1>
      <div className="mt-5 grid max-w-3xl gap-4 text-base leading-7 text-white/62">
        {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/shop" className="rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-[#dfe8d8]">Bekijk collectie</Link>
        <Link href="/contact" className="rounded-full border border-white/15 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10">Contact support</Link>
      </div>
    </section>

    <section className="mt-8 grid gap-4 md:grid-cols-3">
      {values.map(({ icon: Icon, title, text }) => <div key={title} className="card rounded-[1.6rem] p-6">
        <Icon className="text-[#b7c8ad]" />
        <h2 className="mt-4 text-xl font-black">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
      </div>)}
    </section>

    <section className="mt-8 grid gap-5 rounded-[2rem] border border-white/10 bg-white/[.035] p-6 md:grid-cols-[.8fr_1.2fr] md:p-8">
      <div>
        <Sparkles className="text-[#b7c8ad]" />
        <h2 className="mt-4 text-2xl font-black">Waarom deze pagina belangrijk is</h2>
      </div>
      <p className="text-sm leading-7 text-white/58">Een duidelijke over-ons pagina, contactinformatie, verzendinformatie, retourbeleid en voorwaarden helpen bezoekers en zoekmachines begrijpen dat ASORTA een echte webshop is met een herkenbare serviceflow. Daarom houden we deze pagina’s zichtbaar, actueel en klantgericht.</p>
    </section>
  </main>
}
