import Link from 'next/link'

export const metadata = { title: 'Checkout | ASORTA' }
export default function CheckoutPage(){
  return <main className="mx-auto max-w-5xl px-4 py-14 md:px-6">
    <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Checkout</p>
    <h1 className="mt-4 text-5xl font-black">Guest or account checkout</h1>
    <p className="mt-4 max-w-2xl text-white/60">Payment wordt later gekoppeld na KvK-verificatie. Deze pagina is alvast voorbereid voor gastbestellingen en klantaccounts.</p>
    <div className="mt-8 grid gap-5 md:grid-cols-2">
      <div className="card rounded-[2rem] p-6"><h2 className="text-2xl font-black">Checkout as guest</h2><p className="mt-3 text-white/55">Snel bestellen zonder account. Tracking wordt naar e-mail gestuurd.</p><button className="btn-primary mt-6 w-full" disabled>Payment soon</button></div>
      <div className="card rounded-[2rem] p-6"><h2 className="text-2xl font-black">Login for faster checkout</h2><p className="mt-3 text-white/55">Klantportaal met bestelhistorie en tracking zodra Supabase Auth actief is.</p><Link className="btn-secondary mt-6 w-full" href="/login">Login</Link></div>
    </div>
  </main>
}
