import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { saveSearchProfile } from '@/app/housing/actions'
import LocationPicker from '@/components/LocationPicker'
import InfoTip from '@/components/InfoTip'
import { BellRing, MapPin, SlidersHorizontal } from 'lucide-react'

export const dynamic='force-dynamic'
export const metadata={title:'Mijn zoekprofiel'}

const types=[
  {value:'apartment',label:'Appartement',info:'Een zelfstandige woning in een gebouw met meerdere woningen.'},
  {value:'house',label:'Eengezinswoning',info:'Een zelfstandige woning met een eigen voordeur, meestal op de begane grond.'},
  {value:'maisonette',label:'Maisonnette',info:'Een appartement met woonruimte verdeeld over twee of meer verdiepingen.'},
  {value:'studio',label:'Studio',info:'Een compacte woning waarin woon- en slaapruimte meestal één kamer vormen.'},
  {value:'senior',label:'Seniorenwoning',info:'Een woning die is ingericht of bestemd voor oudere bewoners.'},
  {value:'other',label:'Overig',info:'Gebruik dit voor woningtypen die niet onder de andere keuzes vallen.'},
]

export default async function SearchProfile({searchParams}:{searchParams:Promise<{saved?:string;error?:string}>}){
  const p=await searchParams,s=await createClient(),{data:{user}}=await s.auth.getUser()
  if(!user)redirect('/login?next=/search-profile')
  const {data:profile}=await s.from('search_profiles').select('*,search_locations(city),search_property_types(property_type)').eq('user_id',user.id).maybeSingle()
  const selected=new Set((profile?.search_property_types||[]).map((x:any)=>x.property_type))
  const locations=(profile?.search_locations||[]).map((x:any)=>String(x.city||'').trim()).filter(Boolean)
  return <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 sm:px-5">
    <p className="kicker">Stap 2 van 2</p>
    <h1 className="mt-3 text-4xl font-black sm:text-6xl">Waar wil je naartoe?</h1>
    <p className="mt-4 max-w-3xl text-lg leading-8 text-white/52">Alleen een gewenste locatie is verplicht. Laat andere velden leeg als je ruim wilt zoeken; hoe meer harde eisen je kiest, hoe minder matches mogelijk zijn.</p>
    {p.saved&&<Notice good>Zoekprofiel opgeslagen. Asorta kan nu naar wederzijdse matches zoeken.</Notice>}
    {p.error&&<Notice>{p.error}</Notice>}
    <form action={saveSearchProfile} className="mt-8 grid gap-6">
      <Section icon={<MapPin/>} title="Gewenste locaties"><LocationPicker initialLocations={locations}/></Section>
      <Section icon={<SlidersHorizontal/>} title="Woonwensen">
        <fieldset>
          <div className="flex items-center justify-between gap-3"><legend className="text-sm font-black text-white/72">Woningtypen <span className="font-medium text-white/38">(optioneel)</span></legend><InfoTip text="Kies alleen woningtypen die je echt wilt. Laat alles uitgevinkt om met alle woningtypen gematcht te kunnen worden." label="Uitleg woningtypen"/></div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{types.map((type)=><Choice key={type.value} {...type} checked={selected.has(type.value)}/>)}</div>
        </fieldset>
        <p className="mt-6 text-sm leading-6 text-white/45">De onderstaande grenzen zijn allemaal optioneel. Een leeg veld sluit niets uit.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input name="min_rent" label="Minimale huur" info="Woningen met een lagere kale maandhuur worden uitgesloten. Meestal kun je dit veld leeg laten." type="number" min="0" step="1" inputMode="numeric" defaultValue={profile?.min_rent??''} placeholder="Geen minimum"/>
          <Input name="max_rent" label="Maximale huur" info="De hoogste kale maandhuur die je wilt betalen. Laat leeg als je geen maximumbedrag wilt instellen." type="number" min="0" step="1" inputMode="numeric" defaultValue={profile?.max_rent??''} placeholder="Geen maximum"/>
          <Input name="min_rooms" label="Minimaal aantal kamers" info="Het minimale totale aantal kamers, inclusief woonkamer. Laat leeg als het aantal niet belangrijk is." type="number" min="1" max="30" step="1" inputMode="numeric" defaultValue={profile?.min_rooms??''} placeholder="Geen minimum"/>
          <Input name="min_bedrooms" label="Minimaal slaapkamers" info="Het minimale aantal afzonderlijke slaapkamers. Laat leeg als je hier geen harde eis aan stelt." type="number" min="0" max="20" step="1" inputMode="numeric" defaultValue={profile?.min_bedrooms??''} placeholder="Geen minimum"/>
          <Input name="min_living_area_m2" label="Minimaal woonoppervlak" info="De kleinste gewenste woonoppervlakte in vierkante meters. Laat leeg om geen woningen op oppervlakte uit te sluiten." type="number" min="10" max="1000" step="1" inputMode="numeric" defaultValue={profile?.min_living_area_m2??''} placeholder="Geen minimum"/>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Check name="garden_required" label="Tuin vereist" info="Vink dit alleen aan als een woning zonder eigen tuin niet geschikt is." checked={profile?.garden_required}/>
          <Check name="balcony_required" label="Balkon vereist" info="Vink dit alleen aan als een woning zonder balkon niet geschikt is." checked={profile?.balcony_required}/>
          <Check name="elevator_required" label="Lift vereist" info="Vink dit aan als een lift noodzakelijk is bij woningen boven de begane grond." checked={profile?.elevator_required}/>
          <Check name="ground_floor_required" label="Begane grond vereist" info="Vink dit aan als je uitsluitend een woning op de begane grond zoekt." checked={profile?.ground_floor_required}/>
          <Check name="wheelchair_required" label="Rolstoeltoegankelijk" info="Vink dit aan als rolstoeltoegankelijkheid een noodzakelijke voorwaarde is." checked={profile?.wheelchair_required}/>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="search-notes" className="text-sm font-bold text-white/70">Extra wensen <span className="font-medium text-white/38">(optioneel)</span></label><InfoTip text="Hier kun je zachte voorkeuren noemen, zoals een rustige buurt of openbaar vervoer. Deze tekst wordt niet als harde automatische filter gebruikt." label="Uitleg extra wensen"/></div>
          <textarea id="search-notes" name="notes" defaultValue={profile?.notes||''} className="field min-h-32" maxLength={1000} placeholder="Bijvoorbeeld: rustige buurt of dichtbij openbaar vervoer"/>
        </div>
      </Section>
      <div className="flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-[#b8ff5a]/20 bg-[#b8ff5a]/[.06] p-6 sm:flex-row sm:items-center"><div className="flex gap-3"><BellRing className="mt-1 shrink-0 text-[#b8ff5a]"/><div><strong className="text-xl">Automatisch blijven zoeken</strong><p className="mt-1 text-sm text-white/48">Bij een nieuwe wederzijdse match krijg je een melding.</p></div></div><button className="btn-primary shrink-0">Zoekprofiel opslaan</button></div>
    </form>
  </main>
}

function Section({icon,title,children}:{icon:React.ReactNode;title:string;children:React.ReactNode}){return <section className="card rounded-[2rem] p-6 sm:p-8"><div className="mb-6 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#b8ff5a] text-black [&_svg]:h-5 [&_svg]:w-5">{icon}</span><h2 className="text-2xl font-black">{title}</h2></div>{children}</section>}
function Input({label,info,name,...props}:React.InputHTMLAttributes<HTMLInputElement>&{label:string;info:string;name:string}){return <div><div className="mb-2 flex items-center justify-between gap-2"><label htmlFor={name} className="text-sm font-bold text-white/70">{label}</label><InfoTip text={info} label={`Uitleg ${label}`}/></div><input {...props} id={name} name={name} className="field"/></div>}
function Choice({value,label,info,checked}:{value:string;label:string;info:string;checked:boolean}){const id=`type-${value}`;return <div className="flex items-center gap-3 rounded-2xl border border-white/10 p-4"><label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-sm font-bold"><input id={id} type="checkbox" name="property_types" value={value} defaultChecked={checked} className="accent-[#b8ff5a]"/>{label}</label><InfoTip text={info} label={`Uitleg ${label}`}/></div>}
function Check({name,label,info,checked}:{name:string;label:string;info:string;checked?:boolean}){return <div className="flex items-center gap-3 rounded-2xl border border-white/10 p-4"><label htmlFor={name} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-sm font-bold"><input id={name} name={name} type="checkbox" defaultChecked={Boolean(checked)} className="accent-[#b8ff5a]"/>{label}</label><InfoTip text={info} label={`Uitleg ${label}`}/></div>}
function Notice({children,good=false}:{children:React.ReactNode;good?:boolean}){return <div className={`mt-6 rounded-2xl border p-4 text-sm font-bold ${good?'border-[#b8ff5a]/25 bg-[#b8ff5a]/10 text-[#dcffb5]':'border-red-400/25 bg-red-500/10 text-red-100'}`}>{children}</div>}
