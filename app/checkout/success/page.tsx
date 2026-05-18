import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { getSiteContent } from '@/lib/site-content'

export const metadata = { title: 'Order received | ASORTA' }

export default async function CheckoutSuccessPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {}
  const content = await getSiteContent()
  const order = Array.isArray(params.order) ? params.order[0] : params.order
  const text = order
    ? content['checkout.success.textWithOrder'].replace('{order}', String(order))
    : content['checkout.success.text']

  return <main className="mx-auto max-w-3xl px-4 py-16 md:px-6"><div className="card rounded-[2rem] p-8 text-center md:p-12"><CheckCircle2 className="mx-auto text-emerald-300" size={54} /><p className="kicker mt-6">{content['checkout.success.kicker']}</p><h1 className="mt-3 text-4xl font-black md:text-6xl">{content['checkout.success.title']}</h1><p className="mt-4 text-white/58">{text}</p><Link href="/shop" className="btn-primary mt-8">{content['checkout.success.button']}</Link></div></main>
}
