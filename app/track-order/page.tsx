import Link from 'next/link'
import { Mail, PackageSearch, Search, Truck } from 'lucide-react'

export const metadata = {
  title: 'Order volgen | ASORTA',
  description: 'Volg je ASORTA bestelling of neem contact op met support als je tracking nog niet beschikbaar is.',
}

export default function TrackOrderPage() {
  return <main className="mx-auto max-w-5xl px-4 py-10 sm:px-5 md:py-14">
    <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(111,125,100,.18),transparent_38%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
      <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Order status</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Volg je bestelling</h1>
      <p className="mt-4 max-w-2xl text-white/60">Zodra je order door Shopify/DSers is verwerkt en tracking beschikbaar is, ontvang je automatisch een verzendbevestiging met trackinglink.</p>
    </section>

    <section className="mt-8 grid gap-4 md:grid-cols-3">
      <div className="card rounded-[1.6rem] p-6"><PackageSearch className="text-[#b7c8ad]"/><h2 className="mt-4 text-xl font-black">1. Order ontvangen</h2><p className="mt-2 text-sm leading-6 text-white/55">Na betaling krijg je een bevestiging van de Shopify checkout.</p></div>
      <div className="card rounded-[1.6rem] p-6"><Truck className="text-[#b7c8ad]"/><h2 className="mt-4 text-xl font-black">2. Fulfillment</h2><p className="mt-2 text-sm leading-6 text-white/55">DSers verwerkt de Shopify order bij de leverancier of het warehouse.</p></div>
      <div className="card rounded-[1.6rem] p-6"><Mail className="text-[#b7c8ad]"/><h2 className="mt-4 text-xl font-black">3. Tracking</h2><p className="mt-2 text-sm leading-6 text-white/55">Zodra tracking beschikbaar is, ontvang je de trackinginformatie per e-mail.</p></div>
    </section>

    <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[.035] p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><Search className="text-[#b7c8ad]"/><h2 className="mt-3 text-2xl font-black">Geen tracking ontvangen?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Stuur ons je ordernummer en e-mailadres. Dan kijken we de Shopify/DSers status voor je na.</p></div>
        <Link href="/contact" className="rounded-full bg-white px-6 py-3 text-center text-sm font-black text-black transition hover:bg-[#dfe8d8]">Contact support</Link>
      </div>
    </section>
  </main>
}
