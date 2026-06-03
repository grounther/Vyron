import Link from 'next/link'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { getSiteContent } from '@/lib/site-content'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTcgState } from '@/lib/tcg-game-server'
import { capturePayPalOrder } from '@/lib/checkout/paypal'
import TcgPackOpener from '@/components/TcgPackOpener'
import ClearCartOnSuccess from '@/components/ClearCartOnSuccess'

export const metadata = { title: 'Order received | ASORTA' }

export default async function CheckoutSuccessPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {}
  const content = await getSiteContent()
  const order = Array.isArray(params.order) ? params.order[0] : params.order
  const payment = Array.isArray(params.payment) ? params.payment[0] : params.payment
  const token = Array.isArray(params.token) ? params.token[0] : params.token
  let captureMessage = ''
  let captureError = ''

  const admin = createAdminClient()
  if (payment === 'paypal' && token && admin) {
    try {
      const result = await capturePayPalOrder(admin, String(token), order ? String(order) : undefined)
      captureMessage = result.status === 'already_paid' ? 'Deze PayPal betaling was al verwerkt.' : 'PayPal betaling ontvangen en verwerkt.'
    } catch (error) {
      captureError = error instanceof Error ? error.message : 'PayPal betaling kon niet automatisch worden verwerkt.'
    }
  }

  const text = order
    ? content['checkout.success.textWithOrder'].replace('{order}', String(order))
    : content['checkout.success.text']

  let packCount = 0
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

  return <main className="mx-auto max-w-3xl px-4 py-16 md:px-6">
    <div className="card rounded-[2rem] p-8 text-center md:p-12">
      {!captureError ? <ClearCartOnSuccess /> : null}
      {captureError ? <AlertTriangle className="mx-auto text-amber-300" size={54} /> : <CheckCircle2 className="mx-auto text-emerald-300" size={54} />}
      <p className="kicker mt-6">{content['checkout.success.kicker']}</p>
      <h1 className="mt-3 text-4xl font-black md:text-6xl">{captureError ? 'Betaling wordt gecontroleerd' : content['checkout.success.title']}</h1>
      <p className="mt-4 text-white/58">{captureError ? 'Je order is aangemaakt, maar de PayPal bevestiging kon niet direct worden afgerond. Neem contact op als dit blijft staan.' : text}</p>
      {captureMessage ? <p className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">{captureMessage}</p> : null}
      {captureError ? <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{captureError}</p> : null}
      {packCount > 0 ? (
        <div className="mt-8 text-left">
          <TcgPackOpener initialPackCount={packCount} autoOpen />
        </div>
      ) : null}
      <Link href="/shop" className="btn-primary mt-8">{content['checkout.success.button']}</Link>
    </div>
  </main>
}
