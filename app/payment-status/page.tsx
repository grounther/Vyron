import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fulfillHousingPayment } from '@/lib/mollie'
import { CheckCircle2, Clock3, XCircle } from 'lucide-react'

export const dynamic='force-dynamic'
export default async function PaymentStatus({searchParams}:{searchParams:Promise<{id?:string}>}){
  const {id}=await searchParams,s=await createClient(),{data:{user}}=await s.auth.getUser();if(!user)redirect('/login?next=/account')
  let {data:payment}=await s.from('payments').select('*').eq('id',id||'').eq('user_id',user.id).maybeSingle()
  if(payment&&payment.status!=='paid'&&payment.provider_payment_id){try{payment=await fulfillHousingPayment(payment.id,payment.provider_payment_id) as any}catch{}}
  const paid=payment?.status==='paid',failed=['failed','canceled','expired'].includes(payment?.status||'')
  return <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 py-16"><section className="card w-full rounded-[2rem] p-8 text-center">{paid?<CheckCircle2 size={62} className="mx-auto text-[#b8ff5a]"/>:failed?<XCircle size={62} className="mx-auto text-red-300"/>:<Clock3 size={62} className="mx-auto text-amber-200"/>}<h1 className="mt-5 text-4xl font-black">{paid?'Betaling geslaagd':failed?'Betaling niet afgerond':'Betaling wordt verwerkt'}</h1><p className="mt-4 leading-7 text-white/50">{paid?(payment?.purpose==='listing_activation'?'Je woning staat actief en doet nu mee met matching.':'Je zoektoegang is voor één jaar geactiveerd.'):failed?'Je kunt veilig opnieuw proberen. Er is geen toegang geactiveerd.':'Dit kan soms een paar seconden duren. Vernieuw de pagina of bekijk je account.'}</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/account" className="btn-primary">Naar Mijn Asorta</Link>{!paid&&<Link href="/pricing" className="btn-secondary">Bekijk tarieven</Link>}</div></section></main>
}
