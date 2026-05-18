'use client'

import SupportChat from '@/components/SupportChat'
import type { SiteContentMap } from '@/lib/site-content'

export default function ContactClient({ content }: { content: SiteContentMap }) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(111,125,100,.18),transparent_38%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
        <p className="kicker">{content['contact.kicker']}</p>
        <h1 className="mt-4 text-5xl font-black tracking-tight md:text-6xl">{content['contact.title']}</h1>
        <p className="mt-4 max-w-2xl text-white/62">{content['contact.text']}</p>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <div className="card rounded-[2rem] p-6 md:p-8">
          <p className="kicker">{content['contact.chat.kicker']}</p>
          <h2 className="mt-3 text-3xl font-black">{content['contact.chat.title']}</h2>
          <p className="mt-3 text-sm leading-6 text-white/55">{content['contact.chat.text']}</p>
          <div className="mt-6"><SupportChat source="contact-page" mode="page" /></div>
        </div>

        <div className="card rounded-[2rem] p-6 md:p-8">
          <p className="kicker">{content['contact.info.kicker']}</p>
          <h2 className="mt-3 text-3xl font-black">{content['contact.info.title']}</h2>
          <div className="mt-6 grid gap-4 text-sm leading-6 text-white/60">
            <div className="rounded-3xl border border-white/10 bg-white/[.035] p-5"><p className="font-black text-white">{content['contact.email.label']}</p><a className="mt-1 block text-[#c8d6bd]" href="mailto:info@asorta.nl">info@asorta.nl</a></div>
            <div className="rounded-3xl border border-white/10 bg-white/[.035] p-5"><p className="font-black text-white">{content['contact.flow.title']}</p><p className="mt-1">{content['contact.flow.text']}</p></div>
            <div className="rounded-3xl border border-white/10 bg-white/[.035] p-5"><p className="font-black text-white">{content['contact.response.title']}</p><p className="mt-1">{content['contact.response.text']}</p></div>
          </div>
        </div>
      </section>
    </main>
  )
}
