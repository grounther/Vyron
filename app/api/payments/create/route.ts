import { NextRequest,NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { mollie } from '@/lib/mollie'

export async function POST(req:NextRequest){
  const s=await createClient(),{data:{user}}=await s.auth.getUser(),form=await req.formData()
  const purpose=String(form.get('purpose')||''),listingId=String(form.get('listing_id')||'')||null
  if(!user)return NextResponse.redirect(new URL('/login?next=/account',req.url),303)
  try{
    if(!['listing_activation','search_year'].includes(purpose))throw new Error('Ongeldige betaling.')
    if(form.get('immediate_service')!=='on')throw new Error('Bevestig dat de dienst direct mag starten.')
    if(purpose==='listing_activation'){
      const {data:listing}=await s.from('listings').select('id,status').eq('id',listingId).eq('user_id',user.id).maybeSingle()
      if(!listing||listing.status!=='pending_payment')throw new Error('Deze woning kan niet worden geactiveerd.')
    }
    const admin=createAdminClient();if(!admin)throw new Error('Betalingen zijn nog niet geconfigureerd.')
    const amount=purpose==='listing_activation'?2:5
    const {data:local,error}=await admin.from('payments').insert({user_id:user.id,purpose,listing_id:purpose==='listing_activation'?listingId:null,amount,currency:'EUR',status:'open'}).select('id').single()
    if(error||!local)throw error||new Error('Betaling kon niet worden gestart.')
    await admin.from('legal_consents').upsert({user_id:user.id,document_type:'immediate_service',document_version:'2026-09-02',accepted:true,accepted_at:new Date().toISOString()},{onConflict:'user_id,document_type,document_version'})
    const origin=process.env.NEXT_PUBLIC_SITE_URL||req.nextUrl.origin
    const payment=await mollie('/payments',{method:'POST',body:JSON.stringify({amount:{currency:'EUR',value:amount.toFixed(2)},description:purpose==='listing_activation'?'ASORTA woning activeren':'ASORTA zoektoegang — 1 jaar',redirectUrl:`${origin}/payment-status?id=${local.id}`,webhookUrl:`${origin}/api/mollie/webhook`,metadata:{kind:'housing_access',payment_id:local.id,purpose,user_id:user.id,listing_id:listingId}})})
    await admin.from('payments').update({provider_payment_id:payment.id,status:'pending',updated_at:new Date().toISOString()}).eq('id',local.id)
    return NextResponse.redirect(payment._links.checkout.href,303)
  }catch(e){return NextResponse.redirect(new URL(`/checkout-access?purpose=${purpose}&${listingId?`listing=${listingId}&`:''}error=${encodeURIComponent(e instanceof Error?e.message:'Betaling starten mislukt.')}`,req.url),303)}
}
