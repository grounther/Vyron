import CheckoutClient from './CheckoutClient'
import { getSiteContent } from '@/lib/site-content'

export const metadata = { title: 'Checkout | ASORTA' }

export default async function CheckoutPage() {
  const content = await getSiteContent()
  return <main className="mx-auto max-w-7xl px-4 py-10 md:px-6"><CheckoutClient copy={{
    emptyTitle: content['checkout.empty.title'],
    emptyText: content['checkout.empty.text'],
    shopProducts: content['checkout.empty.button'],
    secure: content['checkout.kicker'],
    title: content['checkout.title'],
    intro: content['checkout.intro'],
    email: content['checkout.email.label'],
    emailHelp: content['checkout.email.help'],
    discount: content['checkout.discount.label'],
    discountHelp: content['checkout.discount.help'],
    apply: content['checkout.apply'],
    bridgeNote: content['checkout.note'],
    order: content['checkout.order.kicker'],
    summary: content['checkout.summary.title'],
    pay: content['checkout.pay.button'],
    afterPayment: content['checkout.afterPayment'],
    trust1: content['checkout.trust1'],
    trust2: content['checkout.trust2'],
    trust3: content['checkout.trust3'],
  }} /></main>
}
