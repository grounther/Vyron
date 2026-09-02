import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateProfile } from '@/app/housing/actions'
import { ShieldCheck, UserRound } from 'lucide-react'

export const dynamic='force-dynamic'
export const metadata={title:'Profiel en privacy'}
export default async function ProfilePage({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}){
  const p=await searchParams,s=await createClient(),{data:{user}}=await s.auth.getUser()
  if(!user)redirect('/login?next=/profile')
  const {data:profile}=await s.from('profiles').select('*').eq('id',user.id).maybeSingle()
  return <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-5"><p className="kicker">Privacy & profiel</p><h1 className="mt-3 text-4xl font-black sm:text-6xl">Hoe wil je zichtbaar zijn?</h1><p className="mt-4 max-w-2xl leading-7 text-white/50">Iedereen krijgt een vaste anonieme Ruiler-ID. Je mag ook een eigen weergavenaam kiezen. Je echte naam, e-mailadres en telefoonnummer worden nooit automatisch gedeeld.</p>
    {p.saved&&<Notice good>Je profiel is opgeslagen.</Notice>}{p.error&&<Notice>{p.error}</Notice>}
    <form action={updateProfile} className="card mt-8 grid gap-6 rounded-[2rem] p-6 sm:p-8"><div className="flex items-center gap-4 rounded-2xl border border-[#b8ff5a]/20 bg-[#b8ff5a]/[.06] p-4"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#b8ff5a] text-black"><UserRound/></span><div><span className="text-xs font-black uppercase tracking-wider text-white/40">Jouw vaste Ruiler-ID</span><strong className="mt-1 block text-xl">{profile?.system_username||'Wordt aangemaakt'}</strong></div></div>
      <fieldset><legend className="font-black">Weergavenaam</legend><div className="mt-3 grid gap-3"><label className="flex cursor-pointer gap-3 rounded-2xl border border-white/10 p-4"><input type="radio" name="display_name_mode" value="system" defaultChecked={!profile||profile.display_name_mode!=='custom'} className="mt-1 accent-[#b8ff5a]"/><span><strong>Gebruik mijn Ruiler-ID</strong><small className="mt-1 block text-white/45">Bijvoorbeeld {profile?.system_username||'Ruiler#00001'}.</small></span></label><label className="flex cursor-pointer gap-3 rounded-2xl border border-white/10 p-4"><input type="radio" name="display_name_mode" value="custom" defaultChecked={profile?.display_name_mode==='custom'} className="mt-1 accent-[#b8ff5a]"/><span className="w-full"><strong>Kies zelf een naam</strong><input name="custom_display_name" defaultValue={profile?.custom_display_name||''} className="field mt-3" placeholder="Bijv. GezinUitRaalte" maxLength={30}/></span></label></div></fieldset>
      <label className="label"><span>Telefoonnummer (privé)</span><input name="phone" defaultValue={profile?.phone||''} className="field" autoComplete="tel" placeholder="Alleen delen na jouw toestemming"/></label>
      <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/48"><ShieldCheck className="mt-0.5 shrink-0 text-[#b8ff5a]" size={19}/>Persoonsgegevens delen blijft altijd een aparte wederzijdse keuze in een serieuze match. Je weergavenaam verandert dat niet.</div>
      <button className="btn-primary justify-self-start">Profiel opslaan</button>
    </form>
  </main>
}
function Notice({children,good=false}:{children:React.ReactNode;good?:boolean}){return <div className={`mt-6 rounded-2xl border p-4 text-sm font-bold ${good?'border-[#b8ff5a]/25 bg-[#b8ff5a]/10 text-[#dcffb5]':'border-red-400/25 bg-red-500/10 text-red-100'}`}>{children}</div>}
