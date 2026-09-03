import Link from 'next/link'
import { ArrowRightLeft, Building2, CreditCard, FileClock, Flag, Home, MessageCircle, ShieldCheck, Sparkles, UserCog, Users } from 'lucide-react'
import { assertAtlasPermission, hasAtlasPermission, type AtlasPermission } from '@/lib/atlas-auth'

export const dynamic='force-dynamic'
export const metadata={title:'Atlas | ASORTA',robots:{index:false,follow:false}}

export default async function Atlas(){
  const{admin,staff}=await assertAtlasPermission('support','/atlas')
  const[countUsers,countListings,countMatches,countPayments,countReports,countPrivacy,countPhotos]=await Promise.all([
    admin.from('profiles').select('*',{count:'exact',head:true}),
    admin.from('listings').select('*',{count:'exact',head:true}).eq('status','active'),
    admin.from('matches').select('*',{count:'exact',head:true}).in('status',['active','swap_in_progress']),
    admin.from('payments').select('*',{count:'exact',head:true}).eq('status','paid'),
    admin.from('reports').select('*',{count:'exact',head:true}).in('status',['open','reviewing']),
    admin.from('privacy_requests').select('*',{count:'exact',head:true}).in('status',['open','reviewing']),
    admin.from('listing_photos').select('*',{count:'exact',head:true}).eq('moderation_status','pending'),
  ])
  const stats=[[Users,'Gebruikers',countUsers.count||0],[Home,'Actieve woningen',countListings.count||0],[Sparkles,'Open matches',countMatches.count||0],[CreditCard,'Betaalde transacties',countPayments.count||0],[Flag,'Open meldingen',countReports.count||0],[ShieldCheck,'Privacyverzoeken',countPrivacy.count||0],[Building2,'Foto’s te keuren',countPhotos.count||0]] as const
  const tiles:[AtlasPermission,string,React.ReactNode,string,string][]= [
    ['support','/atlas/support',<MessageCircle key="support"/>,'Live support','Beantwoord vragen en herroepingsverzoeken.'],
    ['support','/atlas/housing',<Building2 key="housing"/>,'Woningen & foto’s','Bekijk woningstatussen en keur met beheerdersrecht nieuwe foto’s.'],
    ['settings','/atlas/providers',<Home key="providers"/>,'Corporaties','Voeg verhuurders toe en controleer woningruilgegevens.'],
    ['settings','/atlas/payments',<CreditCard key="payments"/>,'Betalingen & refunds','Controleer Mollie-transacties en volledige terugbetalingen.'],
    ['support','/atlas/reports',<Flag key="reports"/>,'Rapportages','Onderzoek meldingen en blokkeer met beheerdersrecht accounts.'],
    ['support','/atlas/swaps',<ArrowRightLeft key="swaps"/>,'Ruildossiers','Volg verhuurderstatussen en afgeronde woningruilen.'],
    ['settings','/atlas/privacy',<ShieldCheck key="privacy"/>,'Privacyverzoeken','Behandel export- en verwijderverzoeken aantoonbaar.'],
    ['settings','/atlas/audit',<FileClock key="audit"/>,'Auditlog','Bekijk welke beheerder welke wijziging uitvoerde.'],
    ['settings','/atlas/staff',<UserCog key="staff"/>,'Medewerkers','Beheer Atlas-rechten en deactiveer toegang.'],
  ]
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-14 sm:px-5"><p className="kicker">Beheeromgeving</p><h1 className="mt-3 text-4xl font-black sm:text-6xl">ASORTA Woningruil Atlas</h1><p className="mt-3 text-white/45">Ingelogd als {staff.displayName}</p><div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">{stats.map(([Icon,label,value])=><div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><Icon className="text-[#b8ff5a]" size={20}/><strong className="mt-7 block text-3xl">{value}</strong><span className="text-xs text-white/42">{label}</span></div>)}</div><div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{tiles.filter(([permission])=>hasAtlasPermission(staff,permission)).map(([,href,icon,title,text])=><Tile key={href} href={href} icon={icon} title={title} text={text}/>)}</div></main>
}
function Tile({href,icon,title,text}:{href:string;icon:React.ReactNode;title:string;text:string}){return <Link href={href} className="rounded-[1.7rem] border border-white/10 bg-white/[.035] p-6 transition hover:-translate-y-1 hover:border-[#b8ff5a]/35"><span className="text-[#b8ff5a] [&_svg]:h-6 [&_svg]:w-6">{icon}</span><h2 className="mt-8 text-2xl font-black">{title}</h2><p className="mt-3 text-sm leading-6 text-white/48">{text}</p></Link>}
