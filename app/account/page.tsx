import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Bell, Building2, Home, Search, Sparkles, UserRound } from 'lucide-react'
import { confirmListingAvailable } from '@/app/housing/actions'

export const dynamic='force-dynamic'
export const metadata={title:'Mijn Asorta'}
export default async function AccountPage(){
  const s=await createClient(),{data:{user}}=await s.auth.getUser()
  if(!user)redirect('/login?next=/account')
  const [{data:profile},{data:listing},{data:search},{count:matchCount},{data:pass},{count:unread}]=await Promise.all([
    s.from('profiles').select('*').eq('id',user.id).maybeSingle(),
    s.from('listings').select('id,status,city,property_type,monthly_rent,created_at').eq('user_id',user.id).in('status',['draft','pending_payment','active','paused','reserved']).maybeSingle(),
    s.from('search_profiles').select('id,status').eq('user_id',user.id).maybeSingle(),
    s.from('matches').select('*',{count:'exact',head:true}).in('status',['active','swap_in_progress']),
    s.from('access_passes').select('status,expires_at').eq('user_id',user.id).eq('status','active').gt('expires_at',new Date().toISOString()).maybeSingle(),
    s.from('notifications').select('*',{count:'exact',head:true}).eq('user_id',user.id).is('read_at',null),
  ])
  const name=profile?.display_name_mode==='custom'&&profile.custom_display_name?profile.custom_display_name:profile?.system_username||'Ruiler'
  const cards=[
    {Icon:Home,label:'Mijn woning',value:listing?statusLabel(listing.status):'Nog niet geplaatst',href:listing?.status==='pending_payment'?'/checkout-access?purpose=listing_activation&listing='+listing.id:'/place-home'},
    {Icon:Search,label:'Zoekprofiel',value:search?.status==='active'?'Actief':'Nog niet actief',href:'/search-profile'},
    {Icon:Sparkles,label:'Matches',value:String(matchCount||0),href:'/matches'},
    {Icon:Bell,label:'Nieuwe meldingen',value:String(unread||0),href:'/notifications'},
  ]
  return <main className="mx-auto min-h-screen max-w-6xl px-4 py-12 sm:px-5"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="kicker">Mijn Asorta</p><h1 className="mt-3 text-4xl font-black sm:text-6xl">Welkom, {name}.</h1><p className="mt-3 text-white/45">{user.email}</p></div><Link href="/profile" className="btn-secondary gap-2 self-start"><UserRound size={17}/> Profiel & privacy</Link></div>
    <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({Icon,label,value,href})=><Link key={label} href={href} className="rounded-[1.5rem] border border-white/10 bg-white/[.035] p-5 transition hover:-translate-y-1 hover:border-[#b8ff5a]/30"><Icon className="text-[#b8ff5a]"/><strong className="mt-7 block text-2xl">{value}</strong><span className="mt-1 block text-sm text-white/42">{label}</span></Link>)}</div>
    <section className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><div className="card rounded-[2rem] p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="kicker">Jouw voortgang</p><h2 className="mt-2 text-3xl font-black">Klaar voor de eerste match?</h2></div><span className="status-pill">{listing&&search?'2/2 gereed':listing||search?'1/2 gereed':'0/2 gereed'}</span></div><div className="mt-7 grid gap-3"><Step done={Boolean(listing)} number="1" title="Woning plaatsen" text={listing?listing.city+' · '+statusLabel(listing.status):'Voeg je huidige huurwoning en corporatie toe.'} href={listing?.status==='pending_payment'?'/checkout-access?purpose=listing_activation&listing='+listing.id:'/place-home'}/><Step done={Boolean(search)} number="2" title="Zoekprofiel maken" text={search?'Je woonwensen zijn opgeslagen.':'Leg vast waar en hoe je wilt wonen.'} href="/search-profile"/><Step done={Boolean(listing&&search&&pass)} number="3" title="Zoektoegang activeren" text={pass?'Actief tot '+new Date(pass.expires_at).toLocaleDateString('nl-NL'):'Volledige matchtoegang voor één jaar.'} href="/checkout-access?purpose=search_year"/></div></div>
      <div className="card rounded-[2rem] p-6 sm:p-8"><Building2 className="text-[#b8ff5a]"/><h2 className="mt-7 text-2xl font-black">Jouw woningstatus</h2>{listing?<><strong className="mt-4 block text-xl">{listing.city}</strong><p className="mt-2 text-white/48">{listing.property_type} · € {Number(listing.monthly_rent).toFixed(0)} per maand</p><span className="status-pill mt-5">{statusLabel(listing.status)}</span>{['active','paused'].includes(listing.status)&&<form action={confirmListingAvailable} className="mt-5"><input type="hidden" name="listing_id" value={listing.id}/><button className="btn-secondary w-full">Ja, mijn woning is nog beschikbaar</button></form>}</>:<><p className="mt-4 leading-7 text-white/48">Je hebt nog geen woning toegevoegd. Zonder woning kan Asorta geen wederzijdse match berekenen.</p><Link href="/place-home" className="btn-primary mt-6">Woning plaatsen</Link></>}<div className="mt-7 border-t border-white/10 pt-5"><form action="/auth/signout" method="post"><button className="text-sm font-black text-white/42 hover:text-white">Uitloggen</button></form></div></div></section>
  </main>
}
function Step({done,number,title,text,href}:{done:boolean;number:string;title:string;text:string;href:string}){return <Link href={href} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/20"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-black ${done?'bg-[#b8ff5a] text-black':'border border-white/15 text-white/45'}`}>{done?'✓':number}</span><span className="min-w-0 flex-1"><strong className="block">{title}</strong><small className="mt-1 block truncate text-white/42">{text}</small></span><span className="text-white/30">→</span></Link>}
function statusLabel(status:string){return ({draft:'Concept',pending_payment:'Wacht op betaling',active:'Actief',paused:'Gepauzeerd',reserved:'Ruil in behandeling'} as Record<string,string>)[status]||status}
