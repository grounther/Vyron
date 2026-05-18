import CheckoutClient from './CheckoutClient'
import { getSiteContent } from '@/lib/site-content'

type CheckoutCopy = {
  emptyTitle?: string
  emptyText?: string
  shopProducts?: string
  secure?: string
  title?: string
  intro?: string
  email?: string
  emailHelp?: string
  discount?: string
  discountHelp?: string
  apply?: string
  bridgeNote?: string
  order?: string
  summary?: string
  pay?: string
  afterPayment?: string
}

export default async function CheckoutPage() {
  const content = await getSiteContent()

  const copy: CheckoutCopy = {
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
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <CheckoutClient copy={copy} />
    </main>
  )
}
