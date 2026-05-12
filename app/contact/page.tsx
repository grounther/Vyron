import { getSiteContent } from '@/lib/site-content'

export default async function Contact(){
  const content = await getSiteContent()
  return <main className="mx-auto max-w-4xl px-5 py-12">
    <h1 className="text-5xl font-black">{content['contact.title']}</h1>
    <div className="card mt-8 rounded-3xl p-8">
      <p className="text-white/65">{content['contact.text']}</p>
      <form className="mt-8 grid gap-4">
        <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Naam"/>
        <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="E-mail"/>
        <textarea className="min-h-36 rounded-2xl border border-white/10 bg-white/5 px-4 py-3" placeholder="Bericht"/>
        <button type="button" className="rounded-full bg-white px-6 py-3 font-black text-black">{content['contact.button']}</button>
      </form>
    </div>
  </main>
}
