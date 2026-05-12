import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, Send, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { replyToSupportConversation, updateSupportStatus } from './actions'

export const metadata = { title: 'Atlas Support | ASORTA', robots: { index: false, follow: false } }

type SearchParams = Promise<{ id?: string }>

export default async function AtlasSupportPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/atlas-access?next=/atlas/support')

  const admin = createAdminClient()
  if (!admin) {
    return <main className="mx-auto max-w-3xl px-5 py-12"><div className="card rounded-[2rem] p-8"><ShieldAlert className="text-amber-200"/><h1 className="mt-4 text-3xl font-black">Service role key ontbreekt</h1><p className="mt-3 text-white/55">Zet SUPABASE_SERVICE_ROLE_KEY in Vercel om Atlas Support te gebruiken.</p></div></main>
  }

  const { data: adminUser } = await admin.from('admin_users').select('email').eq('email', user.email).eq('active', true).maybeSingle()
  if (!adminUser) redirect('/atlas')

  const { data: conversations = [] } = await admin
    .from('support_conversations')
    .select('id, public_token, customer_name, customer_email, subject, status, source, last_message_at, created_at')
    .order('last_message_at', { ascending: false })
    .limit(50)

  const selectedId = params.id || conversations?.[0]?.id
  const selected = conversations?.find((item) => item.id === selectedId) || conversations?.[0]

  const { data: messages = [] } = selected
    ? await admin
        .from('support_messages')
        .select('id, sender_type, author_name, body, created_at')
        .eq('conversation_id', selected.id)
        .order('created_at', { ascending: true })
    : { data: [] }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(111,125,100,.18),transparent_38%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-6 md:p-10">
        <p className="kicker">Atlas Customer Care</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Support Center</h1>
        <p className="mt-4 max-w-2xl text-white/60">Live chats, tickets en contactpagina-berichten komen hier samen. Antwoorden worden opgeslagen én naar de klant gemaild via info@asorta.nl.</p>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[390px_1fr]">
        <div className="card rounded-[2rem] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Gesprekken</h2>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/45">{conversations?.length || 0}</span>
          </div>
          <div className="grid max-h-[680px] gap-2 overflow-auto pr-1">
            {conversations?.length ? conversations.map((conversation) => (
              <Link key={conversation.id} href={`/atlas/support?id=${conversation.id}`} className={`rounded-2xl border p-4 transition hover:bg-white/[.06] ${selected?.id === conversation.id ? 'border-[#b7c8ad]/50 bg-[#6f7d64]/10' : 'border-white/10 bg-white/[.025]'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-white">{conversation.customer_name || conversation.customer_email || 'Customer'}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-white/45">{conversation.subject || 'Support request'}</p>
                  </div>
                  <StatusBadge status={conversation.status} />
                </div>
                <p className="mt-3 text-xs text-white/35">{conversation.source} · {new Date(conversation.last_message_at || conversation.created_at).toLocaleString('nl-NL')}</p>
              </Link>
            )) : <p className="rounded-2xl border border-white/10 bg-white/[.025] p-5 text-sm text-white/50">Nog geen supportgesprekken.</p>}
          </div>
        </div>

        <div className="card rounded-[2rem] p-5">
          {selected ? (
            <>
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3"><MessageCircle className="text-[#b7c8ad]"/><h2 className="text-2xl font-black">{selected.subject || 'Support request'}</h2></div>
                  <p className="mt-2 text-sm text-white/50">{selected.customer_name || 'Customer'} · {selected.customer_email}</p>
                  <p className="mt-1 text-xs text-white/35">Chat #{selected.public_token.slice(0, 8)}</p>
                </div>
                <form action={updateSupportStatus} className="flex gap-2">
                  <input type="hidden" name="conversation_id" value={selected.id} />
                  <select name="status" defaultValue={selected.status} className="rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm font-bold text-white">
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="answered">Answered</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button className="rounded-full bg-white px-4 py-2 text-sm font-black text-black">Opslaan</button>
                </form>
              </div>

              <div className="mt-5 max-h-[520px] overflow-auto rounded-3xl border border-white/10 bg-black/25 p-4">
                {messages?.map((message) => {
                  const customer = message.sender_type === 'customer'
                  return <div key={message.id} className={`mb-4 flex ${customer ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-6 ${customer ? 'border border-white/10 bg-white/[.055] text-white/72' : 'bg-white text-black'}`}>
                      <p className={`mb-1 text-[10px] font-black uppercase tracking-[.18em] ${customer ? 'text-[#b7c8ad]' : 'text-black/45'}`}>{message.author_name || (customer ? 'Customer' : 'ASORTA Support')}</p>
                      {message.body}
                      <p className={`mt-2 text-[10px] ${customer ? 'text-white/30' : 'text-black/35'}`}>{new Date(message.created_at).toLocaleString('nl-NL')}</p>
                    </div>
                  </div>
                })}
              </div>

              <form action={replyToSupportConversation} className="mt-5 grid gap-3">
                <input type="hidden" name="conversation_id" value={selected.id} />
                <textarea name="message" className="support-input min-h-32 resize-none py-4" placeholder="Typ antwoord als ASORTA Support..." />
                <button className="btn-primary w-full">Antwoord versturen <Send className="ml-2" size={17}/></button>
              </form>
            </>
          ) : (
            <div className="grid min-h-96 place-items-center text-center text-white/50">Selecteer een supportgesprek.</div>
          )}
        </div>
      </section>
    </main>
  )
}

function StatusBadge({ status }: { status: string }) {
  const label = status || 'open'
  return <span className="rounded-full border border-white/10 bg-white/[.06] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.14em] text-white/55">{label}</span>
}
