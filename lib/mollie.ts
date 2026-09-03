import { createAdminClient } from "@/lib/supabase/admin";

const api = "https://api.mollie.com/v2";
export async function mollie(path: string, init?: RequestInit) {
  const key = process.env.MOLLIE_API_KEY;
  if (!key)
    throw new Error(
      "MOLLIE_API_KEY ontbreekt. Voeg eerst je Mollie test API-key toe in Vercel.",
    );
  const response = await fetch(`${api}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body?.detail || body?.title || "Mollie-verzoek mislukt.");
  return body;
}

export async function fulfillHousingPayment(localPaymentId: string, providerPaymentId: string) {
  const admin=createAdminClient()
  if(!admin)throw new Error('Supabase service key ontbreekt.')
  const {data:local,error}=await admin.from('payments').select('*').eq('id',localPaymentId).single()
  if(error||!local)throw new Error('Asorta-betaling niet gevonden.')
  if(local.provider_payment_id!==providerPaymentId)throw new Error('Betalingsreferentie klopt niet.')
  const payment=await mollie(`/payments/${encodeURIComponent(providerPaymentId)}`)
  if(payment.status!=='paid')return {...local,status:payment.status}
  if(payment.metadata?.kind!=='housing_access'||payment.metadata?.payment_id!==localPaymentId)throw new Error('Betalingsmetadata klopt niet.')
  if(payment.metadata?.user_id!==local.user_id||payment.metadata?.purpose!==local.purpose)throw new Error('Betalingsmetadata hoort niet bij deze gebruiker of dienst.')
  if(payment.amount?.currency!==local.currency||Number(payment.amount?.value)!==Number(local.amount))throw new Error('Betaalbedrag of valuta klopt niet.')
  const now=new Date(),nowIso=now.toISOString()
  const {data:claimed}=local.status==='paid'?{data:null}:await admin.from('payments').update({status:'paid',paid_at:nowIso,updated_at:nowIso}).eq('id',local.id).in('status',['open','pending']).select('id').maybeSingle()
  if(local.purpose==='listing_activation'){
    const due=new Date(now.getTime()+90*24*60*60*1000).toISOString()
    const {error:listingError}=await admin.from('listings').update({status:'active',activated_at:nowIso,last_confirmed_at:nowIso,confirmation_due_at:due,updated_at:nowIso}).eq('id',local.listing_id).eq('user_id',local.user_id).in('status',['pending_payment','draft'])
    if(listingError)throw listingError
  }else if(local.purpose==='search_year'){
    const {data:existing}=await admin.from('access_passes').select('id,payment_id,starts_at,expires_at').eq('user_id',local.user_id).eq('status','active').maybeSingle()
    const currentExpiry=existing?.expires_at?new Date(existing.expires_at).getTime():0
    const base=Math.max(now.getTime(),Number.isFinite(currentExpiry)?currentExpiry:0)
    const expires=new Date(base+365*24*60*60*1000).toISOString()
    const passResult=existing?.payment_id===local.id
      ? {error:null}
      : existing
      ? await admin.from('access_passes').update({payment_id:local.id,starts_at:existing.starts_at||nowIso,expires_at:expires,status:'active'}).eq('id',existing.id)
      : await admin.from('access_passes').insert({user_id:local.user_id,payment_id:local.id,starts_at:nowIso,expires_at:expires,status:'active'})
    if(passResult.error)throw passResult.error
  }else throw new Error('Onbekend woningruilproduct.')
  if(claimed)await admin.from('notifications').insert({user_id:local.user_id,type:'payment_success',title:'Betaling geslaagd',body:local.purpose==='listing_activation'?'Je woning is actief en doet mee met matching.':'Je zoek- en matchtoegang is één jaar actief.',href:'/account'})
  return {...local,status:'paid',paid_at:nowIso}
}
