import Link from 'next/link'
import { Headphones, Inbox, MessageCircle, CheckCircle2, Clock, Send } from 'lucide-react'
import { assertAtlasAdmin } from '@/lib/atlas-auth'
import { getSupportDashboard } from '@/lib/support'
import { sendTicketReply, updateTicketStatus } from './actions'

export const metadata = { title: 'Atlas Support | ASORTA internal', robots: { index: false, follow: false } }

export default async function AtlasSupportPage() {
  await assertAtlasAdmin('/atlas/support')
  const { tickets, conversations, messages, stats } = await getSupportDashboard()

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <Link href="/atlas" className="text-sm font-black text-white/50 hover:text-white">← Back to Atlas</Link>

      <section className="mt-6 card rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-3">
            <Headphones className="text-[#b7c8ad]" />
            <div>
              <p className="kicker">Customer service</p>
              <h1 className="text-4xl font-black">Live Support Center</h1>
            </div>
          </div>
          <div className="rounded-2xl border border-[#b7c8ad]/20 bg-[#b7c8ad]/10 px-4 py-3 text-sm font-bold text-[#dbe9d4]">
            info@asorta.nl connected
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-white/55">
          Beheer supporttickets, klantberichten en replies vanuit Atlas. Nieuwe berichten komen binnen via de live support widget en kunnen direct per e-mail worden beantwoord.
        </p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-5">
        <Stat icon={<Inbox />} label="Open" value={String(stats.open)} />
        <Stat icon={<Clock />} label="Pending" value={String(stats.pending)} />
        <Stat icon={<Send />} label="Answered" value={String(stats.answered)} />
        <Stat icon={<CheckCircle2 />} label="Closed" value={String(stats.closed)} />
        <Stat icon={<MessageCircle />} label="Chats" value={String(stats.conversations)} />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="card rounded-[2rem] p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black">Support tickets</h2>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/45">{tickets.length} tickets</span>
          </div>

          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.22em] text-[#b7c8ad]">{ticket.ticket_number || 'AS-SUPPORT'}</p>
                    <h3 className="mt-2 text-xl font-black">{ticket.subject || 'Support request'}</h3>
                    <p className="mt-1 text-sm text-white/45">{ticket.email} · {new Date(ticket.created_at).toLocaleString('nl-NL')}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-black uppercase tracking-[.16em] text-white/55">{ticket.status}</span>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/65">{ticket.message}</p>

                <div className="mt-4 grid gap-3 lg:grid-cols-[.75fr_1.25fr]">
                  <form action={updateTicketStatus} className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <input type="hidden" name="id" value={ticket.id} />
                    <select name="status" defaultValue={ticket.status} className="support-input">
                      <option value="new">New</option>
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="answered">Answered</option>
                      <option value="closed">Closed</option>
                    </select>
                    <select name="priority" defaultValue={ticket.priority || 'normal'} className="support-input">
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <button className="btn-secondary w-full" type="submit">Update status</button>
                  </form>

                  <form action={sendTicketReply} className="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <input type="hidden" name="id" value={ticket.id} />
                    <textarea name="reply" required className="support-input min-h-28 resize-none py-4" placeholder="Typ je antwoord aan de klant..." />
                    <button className="btn-primary w-full" type="submit">Reply by email <Send className="ml-2" size={16} /></button>
                  </form>
                </div>
              </article>
            ))}

            {!tickets.length && <p className="rounded-3xl border border-white/10 bg-white/[.035] p-6 text-white/50">Nog geen supporttickets.</p>}
          </div>
        </div>

        <aside className="grid gap-6">
          <div className="card rounded-[2rem] p-5">
            <h2 className="text-2xl font-black">Live conversations</h2>
            <div className="mt-4 grid gap-3">
              {conversations.slice(0, 8).map((conversation) => (
                <div key={conversation.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <p className="font-black">{conversation.customer_email}</p>
                  <p className="mt-1 text-xs uppercase tracking-[.18em] text-white/35">{conversation.status} · {conversation.source || 'website'}</p>
                </div>
              ))}
              {!conversations.length && <p className="text-sm text-white/45">Realtime chat foundation staat klaar. Nieuwe widget gesprekken verschijnen hier.</p>}
            </div>
          </div>

          <div className="card rounded-[2rem] p-5">
            <h2 className="text-2xl font-black">Recent messages</h2>
            <div className="mt-4 grid gap-3">
              {messages.slice(0, 10).map((message) => (
                <div key={message.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <p className="text-xs font-black uppercase tracking-[.18em] text-white/35">{message.sender_type}</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/62">{message.message}</p>
                </div>
              ))}
              {!messages.length && <p className="text-sm text-white/45">Nog geen supportberichten.</p>}
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="card rounded-[1.5rem] p-5"><div className="text-[#b7c8ad]">{icon}</div><p className="mt-4 text-xs font-black uppercase tracking-[.22em] text-white/35">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>
}
