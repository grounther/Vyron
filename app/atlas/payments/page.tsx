import Link from 'next/link'
import { CreditCard, RefreshCcw, RotateCcw } from 'lucide-react'
import { assertAtlasPermission } from '@/lib/atlas-auth'
import { startHousingRefund, syncHousingRefund } from '../operations/actions'

export const dynamic='force-dynamic'
export const metadata={title:'Betalingen | Atlas',robots:{index:false,follow:false}}

export default async function PaymentsPage({searchParams}:{searchParams:Promise<{status?:string;purpose?:string;saved?:string;error?:string}>}){
  const p=await searchParams,{admin}=await assertAtlasPermission('settings','/atlas/payments')
  let query=admin.from('payments').select('*').order('created_at',{ascending:false}).limit(250)
  if(p.status)query=query.eq('status',p.status)
  if(p.purpose)query=query.eq('purpose',p.purpose)
  const{data:payments=[]}=await query
  const userIds=[...new Set((payments||[]).map((x:any)=>x.user_id))]
  const{data:profiles=[]}=userIds.length?await admin.from('profiles').select('id,system_username,custom_display_name,display_name_mode').in('id',userIds):{data:[]}
  const names=new Map((profiles||[]).map((x:any)=>[x.id,x.display_name_mode==='custom'&&x.custom_display_name?x.custom_display_name:x.system_username]))
  const paid=(payments||[]).filter((x:any)=>x.status==='paid').reduce((sum:number,x:any)=>sum+Number(x.amount||0),0)
  const refunded=(payments||[]).filter((x:any)=>x.status==='refunded').reduce((sum:number,x:any)=>sum+Number(x.amount||0),0)
  return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-5"><Header title="Betalingen"/><Notices p={p}/>
    <section className="mt-8 grid gap-4 sm:grid-cols-3"><Metric label="Transacties" value={String((payments||[]).length)}/><Metric label="Betaald in selectie" value={money(paid)}/><Metric label="Terugbetaald" value={money(refunded)}/></section>
    <form className="mt-7 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4"><select name="purpose" defaultValue={p.purpose||''} className="field max-w-56"><option value="">Alle doeleinden</option><option value="listing_activation">Woning activeren</option><option value="search_year">Jaarpas</option></select><select name="status" defaultValue={p.status||''} className="field max-w-48"><option value="">Alle statussen</option>{['open','pending','paid','failed','expired','canceled','refunded'].map(x=><option key={x}>{x}</option>)}</select><button className="btn-secondary">Filter</button></form>
    <div className="mt-6 overflow-x-auto rounded-[1.7rem] border border-white/10"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-white/[.05] text-xs uppercase tracking-wider text-white/45"><tr><th className="p-4">Gebruiker</th><th className="p-4">Doel</th><th className="p-4">Bedrag</th><th className="p-4">Status</th><th className="p-4">Mollie</th><th className="p-4">Datum</th><th className="p-4">Refund</th></tr></thead><tbody>{(payments||[]).map((x:any)=><tr key={x.id} className="border-t border-white/10 align-top"><td className="p-4"><strong>{names.get(x.user_id)||'Ruiler'}</strong><span className="mt-1 block font-mono text-[11px] text-white/32">{x.id.slice(0,8)}</span></td><td className="p-4">{x.purpose==='search_year'?'Zoektoegang 1 jaar':'Woning activeren'}</td><td className="p-4 font-black">{money(Number(x.amount))}</td><td className="p-4 uppercase">{x.status}</td><td className="p-4 font-mono text-xs text-white/45">{x.provider_payment_id||'—'}</td><td className="p-4 text-white/45">{date(x.created_at)}</td><td className="p-4">{x.status==='paid'&&!x.provider_refund_id?<form action={startHousingRefund} className="grid max-w-44 gap-2"><input type="hidden" name="payment_id" value={x.id}/><input name="confirmation" className="field py-2 text-xs" placeholder="TERUGBETALEN"/><button className="btn-secondary gap-2 px-3 py-2 text-xs"><RotateCcw size={14}/> Volledige refund</button></form>:x.provider_refund_id&&x.status!=='refunded'?<form action={syncHousingRefund}><input type="hidden" name="payment_id" value={x.id}/><span className="mb-2 block text-xs text-amber-200">{x.refund_status||'pending'}</span><button className="btn-secondary gap-2 px-3 py-2 text-xs"><RefreshCcw size={14}/> Status ophalen</button></form>:x.status==='refunded'?<span className="text-xs font-black text-[#b8ff5a]">Terugbetaald</span>:<span className="text-white/25">—</span>}</td></tr>)}</tbody></table>{!payments?.length&&<Empty text="Geen betalingen gevonden."/>}</div>
  </main>
}
function Header({title}:{title:string}){return <div className="flex items-end justify-between gap-4"><div><p className="kicker">Atlas beheer</p><h1 className="mt-3 text-4xl font-black sm:text-6xl">{title}</h1></div><Link href="/atlas" className="btn-secondary">Terug</Link></div>}
function Metric({label,value}:{label:string;value:string}){return <div className="card rounded-2xl p-5"><CreditCard className="text-[#b8ff5a]" size={19}/><strong className="mt-5 block text-3xl">{value}</strong><span className="text-xs text-white/40">{label}</span></div>}
function Notices({p}:{p:{saved?:string;error?:string}}){return <>{p.saved&&<div className="mt-6 rounded-2xl border border-[#b8ff5a]/25 bg-[#b8ff5a]/10 p-4 text-sm font-bold">Wijziging verwerkt.</div>}{p.error&&<div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">{p.error}</div>}</>}
function Empty({text}:{text:string}){return <p className="p-8 text-center text-white/42">{text}</p>}
function money(v:number){return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(v)}
function date(v:string){return new Date(v).toLocaleString('nl-NL')}
