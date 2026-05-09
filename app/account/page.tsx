import Link from 'next/link'

export const metadata = { title: 'Account | ASORTA' }
export default function AccountPage(){
  return <main className="mx-auto max-w-4xl px-4 py-16 md:px-6">
    <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">Customer portal</p>
    <h1 className="mt-4 text-5xl font-black">Your ASORTA account</h1>
    <p className="mt-4 text-white/60">Bekijk straks je bestellingen, tracking, facturen en retourstatus. Gastbestellingen blijven mogelijk bij checkout.</p>
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <div className="card rounded-[2rem] p-6"><h2 className="text-2xl font-black">Order tracking</h2><p className="mt-3 text-white/55">Tracking sync wordt gekoppeld zodra CJ fulfilment actief is.</p></div>
      <div className="card rounded-[2rem] p-6"><h2 className="text-2xl font-black">Profile</h2><p className="mt-3 text-white/55">Login via Supabase Auth komt in de backend fase.</p></div>
    </div>
    <Link href="/shop" className="btn-primary mt-8 inline-flex">Continue shopping</Link>
  </main>
}
