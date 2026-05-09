import Link from 'next/link'

export const metadata = { title: 'Login | ASORTA' }
export default function LoginPage(){
  return <main className="mx-auto max-w-md px-4 py-16 md:px-6">
    <div className="card rounded-[2rem] p-6">
      <p className="text-xs font-black uppercase tracking-[.35em] text-[#b7c8ad]">ASORTA account</p>
      <h1 className="mt-4 text-4xl font-black">Login</h1>
      <p className="mt-3 text-sm leading-6 text-white/55">Klantlogin wordt gekoppeld met Supabase Auth. Bestellen als gast blijft beschikbaar via checkout.</p>
      <div className="mt-6 grid gap-3">
        <input className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/30" placeholder="Email" />
        <input className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none placeholder:text-white/30" placeholder="Password" type="password" />
        <button className="btn-primary" disabled>Login soon</button>
      </div>
      <Link href="/checkout" className="mt-5 block text-center text-sm font-bold text-white/45 hover:text-white">Continue as guest</Link>
    </div>
  </main>
}
