import Link from 'next/link'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getSiteContent } from '@/lib/site-content'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTcgState } from '@/lib/tcg-game-server'
import { capturePayPalOrder } from '@/lib/checkout/paypal'
import { processMolliePayment } from '@/lib/checkout/mollie'
import TcgPackOpener from '@/components/TcgPackOpener'
import ClearCartOnSuccess from '@/components/ClearCartOnSuccess'

export const metadata = { title: 'Order received | ASORTA' }

type PaymentState = 'unknown' | 'paid' | 'pending' | 'cancelled' | 'failed'

function normalizeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function normalizePaymentState(status: unknown): PaymentState {
  const value = String(status || '').trim().toLowerCase()
  if (value === 'paid' || value === 'complete' || value === 'completed') return 'paid'
  if (value === 'cancelled' || value === 'canceled' || value === 'expired') return 'cancelled'
  if (value === 'failed' || value === 'denied' || value === 'voided') return 'failed'
  if (value === 'open' || value === 'pending' || value === 'created' || value === 'authorized') return 'pending'
  return 'unknown'
}

function mollieMethodLabel(method: string | undefined) {
  const value = String(method || '').toLowerCase()
  if (value === 'ideal') return 'iDEAL'
  if (value === 'wero') return 'Wero'
  if (value === 'bancontact') return 'Bancontact'
  if (value === 'creditcard') return 'creditcard/debitcard'
  if (value === 'applepay') return 'Apple Pay'
  if (value === 'googlepay') return 'Google Pay'
  if (value === 'klarnapaylater') return 'Klarna achteraf betalen'
  if (value === 'klarnasliceit') return 'Klarna in 3x'
  if (value === 'in3') return 'in3'
  if (value === 'riverty') return 'Riverty'
  return 'Mollie'
}

export default async function CheckoutSuccessPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {}
  const content = await getSiteContent()
  const order = normalizeParam(params.order)
  const payment = normalizeParam(params.payment)
  const method = normalizeParam(params.method)
  const token = normalizeParam(params.token)
  let paymentState: PaymentState = 'unknown'
  let captureMessage = ''
  let captureError = ''

  const admin = createAdminClient()

  if (payment === 'paypal' && token && admin) {
    try {
      const result = await capturePayPalOrder(admin, String(token), order ? String(order) : undefined)
      paymentState = normalizePaymentState(result.order?.payment_status || result.status)
      captureMessage = paymentState === 'paid'
        ? (result.status === 'already_paid' ? 'Deze PayPal betaling was al verwerkt.' : 'PayPal betaling ontvangen en verwerkt.')
        : 'PayPal heeft de betaling nog niet als voldaan bevestigd.'
    } catch (error) {
      paymentState = 'pending'
      captureError = error instanceof Error ? error.message : 'PayPal betaling kon niet automatisch worden verwerkt.'
    }
  }

  if (payment === 'mollie' && order && admin) {
    try {
      const { data: orderRow } = await admin
        .from('orders')
        .select('payment_id,payment_status')
        .eq('order_number', String(order))
        .maybeSingle()

      if (orderRow?.payment_id && normalizePaymentState(orderRow.payment_status) !== 'paid') {
        const result = await processMolliePayment(admin, String(orderRow.payment_id))
        paymentState = result.paid ? 'paid' : normalizePaymentState(result.status)
        const label = mollieMethodLabel(method)
        if (paymentState === 'paid') captureMessage = `${label} betaling ontvangen en verwerkt.`
        else if (paymentState === 'cancelled') captureMessage = `${label} betaling is geannuleerd of verlopen. Er is geen minigame-pakje toegekend.`
        else if (paymentState === 'failed') captureMessage = `${label} betaling is mislukt. Er is geen minigame-pakje toegekend.`
        else captureMessage = `${label} betaling wordt nog gecontroleerd door Mollie. Er wordt pas een minigame-pakje toegekend na betaalbevestiging.`
      } else if (normalizePaymentState(orderRow?.payment_status) === 'paid') {
        paymentState = 'paid'
        captureMessage = 'Deze Mollie betaling was al verwerkt.'
      } else {
        paymentState = 'pending'
        captureMessage = 'Deze betaling is nog niet als voldaan bevestigd.'
      }
    } catch (error) {
      paymentState = 'pending'
      captureError = error instanceof Error ? error.message : 'Mollie betaling kon niet automatisch worden verwerkt.'
    }
  }

  if (paymentState === 'unknown' && order && admin) {
    const { data: orderRow } = await admin
      .from('orders')
      .select('payment_status')
      .eq('order_number', String(order))
      .maybeSingle()
    paymentState = normalizePaymentState(orderRow?.payment_status)
  }

  const isPaid = paymentState === 'paid'
  const isCancelled = paymentState === 'cancelled' || paymentState === 'failed'

  const text = order
    ? content['checkout.success.textWithOrder'].replace('{order}', String(order))
    : content['checkout.success.text']

  let packCount = 0
  if (isPaid) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id && user.email && admin) {
        const state = await getTcgState(admin, user)
        packCount = state.availablePackCount
      }
    } catch {
      packCount = 0
    }
  }

  const title = isPaid
    ? content['checkout.success.title']
    : isCancelled
      ? 'Betaling niet afgerond'
      : 'Betaling wordt gecontroleerd'

  const bodyText = isPaid
    ? text
    : isCancelled
      ? 'Je order is aangemaakt, maar de betaling is geannuleerd, verlopen of mislukt. Je winkelwagen blijft staan en er wordt geen ASORTA minigame-pakje toegekend.'
      : 'Je order is aangemaakt, maar we hebben nog geen betaalbevestiging ontvangen. Je winkelwagen blijft staan en het minigame-pakje wordt pas toegekend zodra de betaling echt voldaan is.'

  return <main className="mx-auto max-w-3xl px-4 py-16 md:px-6">
    <div className="card rounded-[2rem] p-8 text-center md:p-12">
      {isPaid ? <ClearCartOnSuccess /> : null}
      {isPaid ? <CheckCircle2 className="mx-auto text-emerald-300" size={54} /> : <AlertTriangle className="mx-auto text-amber-300" size={54} />}
      <p className="kicker mt-6">{isPaid ? content['checkout.success.kicker'] : 'Checkout'}</p>
      <h1 className="mt-3 text-4xl font-black md:text-6xl">{title}</h1>
      <p className="mt-4 text-white/58">{bodyText}</p>
      {captureMessage ? <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${isPaid ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'border-amber-300/20 bg-amber-300/10 text-amber-100'}`}>{captureMessage}</p> : null}
      {captureError ? <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{captureError}</p> : null}
      {isPaid && packCount > 0 ? (
        <div className="mt-8 text-left">
          <TcgPackOpener initialPackCount={packCount} autoOpen />
        </div>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {!isPaid ? <Link href="/checkout" className="btn-primary">Terug naar checkout</Link> : null}
        <Link href="/shop" className={isPaid ? 'btn-primary' : 'rounded-full border border-white/10 px-5 py-3 text-sm font-black text-white/65 hover:bg-white/10 hover:text-white'}>{isPaid ? content['checkout.success.button'] : 'Verder winkelen'}</Link>
      </div>
    </div>
  </main>
}
