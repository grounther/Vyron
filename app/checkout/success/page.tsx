import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export const metadata = { title: 'Order received | ASORTA' }

export default async function CheckoutSuccessPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {}
  const order = Array.isArray(params.order) ? params.order[0] : params.order
  return <main className="mx-auto max-w-3xl px-4 py-16 md:px-6"><div className="card rounded-[2rem] p-8 text-center md:p-12"><CheckCircle2 className="mx-auto text-emerald-300" size={54} /><p className="kicker mt-6">Order received</p><h1 className="mt-3 text-4xl font-black md:text-6xl">Thanks for your order.</h1><p className="mt-4 text-white/58">{order ? `We hebben order ${order} ontvangen. Zodra de betaling bevestigd is, wordt fulfillment automatisch verwerkt.` : 'Zodra de betaling bevestigd is, wordt fulfillment automatisch verwerkt.'}</p><Link href="/shop" className="btn-primary mt-8">Verder shoppen</Link></div></main>
}
