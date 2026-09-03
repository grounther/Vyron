'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAtlasPermission } from '@/lib/atlas-auth'
import { mollie } from '@/lib/mollie'

const clean=(value:FormDataEntryValue|null,limit=500)=>typeof value==='string'?value.trim().slice(0,limit):''
const validUuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
const safeUrl=(value:FormDataEntryValue|null)=>{const raw=clean(value,300);if(!raw)return null;try{const url=new URL(raw);if(!['http:','https:'].includes(url.protocol))throw new Error();return url.toString()}catch{throw new Error('Gebruik alleen een geldige http- of https-link.')}}

function go(path:string,values:Record<string,string>){const params=new URLSearchParams(values);redirect(`${path}?${params.toString()}`)}

async function audit(admin:any,actor:string|null|undefined,action:string,details:Record<string,unknown>,target?:string|null){
  const {error}=await admin.from('atlas_staff_audit_logs').insert({action,actor_email:actor||null,target_email:target||null,details})
  if(error)console.warn('Atlas audit log',error.message)
}

export async function createProvider(formData:FormData){
  const path='/atlas/providers',name=clean(formData.get('name'),160),type=clean(formData.get('provider_type'),40)
  const {admin,user}=await assertAtlasPermission('providers',path)
  try{
    if(name.length<2)throw new Error('Vul een geldige naam in.')
    if(!['housing_corporation','private_landlord','municipality','other'].includes(type))throw new Error('Ongeldig type verhuurder.')
    const payload={name,provider_type:type,website_url:safeUrl(formData.get('website_url')),contact_email:clean(formData.get('contact_email'),220)||null,contact_phone:clean(formData.get('contact_phone'),50)||null,swap_info_url:safeUrl(formData.get('swap_info_url')),swap_application_url:safeUrl(formData.get('swap_application_url')),source_url:safeUrl(formData.get('source_url')),verified:false,active:true}
    const{data,error}=await admin.from('housing_providers').insert(payload).select('id').single()
    if(error||!data)throw error||new Error('Verhuurder kon niet worden toegevoegd.')
    await audit(admin,user.email,'housing_provider_created',{provider_id:data.id,name,type})
    revalidatePath(path)
  }catch(error){go(path,{error:error instanceof Error?error.message:'Toevoegen mislukt.'})}
  go(path,{saved:'created'})
}

export async function reviewProviderSuggestion(formData:FormData){
  const path='/atlas/providers',id=clean(formData.get('id'),80),decision=clean(formData.get('decision'),20)
  const {admin,user}=await assertAtlasPermission('providers',path)
  try{
    if(!validUuid(id)||!['approved','rejected'].includes(decision))throw new Error('Ongeldig voorstel.')
    const{data:suggestion,error}=await admin.from('housing_provider_suggestions').select('*').eq('id',id).single()
    if(error||!suggestion)throw new Error('Voorstel niet gevonden.')
    if(decision==='approved'){
      const{data:existing,error:lookupError}=await admin.from('housing_providers').select('id').eq('name',suggestion.name).maybeSingle()
      if(lookupError)throw lookupError
      if(!existing){
        const{error:providerError}=await admin.from('housing_providers').insert({name:suggestion.name,provider_type:'other',website_url:suggestion.website_url?safeUrl(suggestion.website_url):null,active:true,verified:false})
        if(providerError)throw providerError
      }
    }
    const{error:updateError}=await admin.from('housing_provider_suggestions').update({status:decision}).eq('id',id)
    if(updateError)throw updateError
    await audit(admin,user.email,'housing_provider_suggestion_reviewed',{suggestion_id:id,decision,name:suggestion.name})
    revalidatePath(path)
  }catch(error){go(path,{error:error instanceof Error?error.message:'Beoordelen mislukt.'})}
  go(path,{saved:'suggestion'})
}

export async function setReportStatus(formData:FormData){
  const path='/atlas/reports',id=clean(formData.get('id'),80),status=clean(formData.get('status'),20)
  const {admin,user}=await assertAtlasPermission('reports',path)
  try{
    if(!validUuid(id)||!['open','reviewing','resolved','dismissed'].includes(status))throw new Error('Ongeldige rapportstatus.')
    const{error}=await admin.from('reports').update({status,updated_at:new Date().toISOString()}).eq('id',id)
    if(error)throw error
    await audit(admin,user.email,'housing_report_status',{report_id:id,status})
    revalidatePath(path)
  }catch(error){go(path,{error:error instanceof Error?error.message:'Rapport bijwerken mislukt.'})}
  go(path,{saved:'report'})
}

export async function setUserBlock(formData:FormData){
  const path='/atlas/reports',userId=clean(formData.get('user_id'),80),blocked=clean(formData.get('blocked'),8)==='true',reason=clean(formData.get('reason'),500),confirmation=clean(formData.get('confirmation'),30)
  const {admin,user}=await assertAtlasPermission('reports',path)
  try{
    if(!validUuid(userId))throw new Error('Gebruiker ontbreekt.')
    if(blocked&&confirmation!=='BLOKKEREN')throw new Error('Typ BLOKKEREN om dit account te blokkeren.')
    if(blocked&&reason.length<5)throw new Error('Leg kort vast waarom dit account wordt geblokkeerd.')
    const{error}=await admin.rpc('set_user_platform_block',{p_user_id:userId,p_blocked:blocked,p_reason:blocked?reason:null})
    if(error)throw error
    await audit(admin,user.email,blocked?'housing_user_blocked':'housing_user_unblocked',{user_id:userId,reason:blocked?reason:null},userId)
    revalidatePath(path);revalidatePath('/atlas/housing')
  }catch(error){go(path,{error:error instanceof Error?error.message:'Accountstatus bijwerken mislukt.'})}
  go(path,{saved:blocked?'blocked':'unblocked'})
}

export async function moderatePhoto(formData:FormData){
  const path='/atlas/housing',id=clean(formData.get('photo_id'),80),status=clean(formData.get('status'),20),note=clean(formData.get('note'),500)
  const {admin,user}=await assertAtlasPermission('housing',path)
  try{
    if(!validUuid(id)||!['approved','rejected'].includes(status))throw new Error('Ongeldige fotokeuze.')
    if(status==='rejected'&&note.length<3)throw new Error('Geef bij afwijzing een korte reden.')
    const{data:photo,error}=await admin.from('listing_photos').update({moderation_status:status,moderation_note:note||null,reviewed_at:new Date().toISOString(),reviewed_by:user.email}).eq('id',id).select('listing_id').single()
    if(error||!photo)throw error||new Error('Foto niet gevonden.')
    await audit(admin,user.email,'housing_photo_moderated',{photo_id:id,listing_id:photo.listing_id,status,note})
    revalidatePath(path);revalidatePath('/');revalidatePath('/homes')
  }catch(error){go(path,{error:error instanceof Error?error.message:'Foto beoordelen mislukt.'})}
  go(path,{saved:'photo'})
}

export async function startHousingRefund(formData:FormData){
  const path='/atlas/payments',id=clean(formData.get('payment_id'),80),confirmation=clean(formData.get('confirmation'),30)
  const {admin,user}=await assertAtlasPermission('payments',path)
  try{
    if(!validUuid(id)||confirmation!=='TERUGBETALEN')throw new Error('Typ TERUGBETALEN om de volledige refund te bevestigen.')
    const{data:payment,error}=await admin.from('payments').select('*').eq('id',id).single()
    if(error||!payment)throw new Error('Betaling niet gevonden.')
    if(payment.status!=='paid'||!payment.provider_payment_id)throw new Error('Alleen een betaalde Mollie-transactie kan worden terugbetaald.')
    if(payment.provider_refund_id)throw new Error('Voor deze betaling bestaat al een refund.')
    const refund=await mollie(`/payments/${encodeURIComponent(payment.provider_payment_id)}/refunds`,{method:'POST',body:JSON.stringify({amount:{currency:'EUR',value:Number(payment.amount).toFixed(2)},description:`ASORTA terugbetaling ${payment.id.slice(0,8)}`,metadata:{kind:'housing_refund',payment_id:payment.id}})})
    const refundStatus=String(refund.status||'pending')
    const{error:updateError}=await admin.from('payments').update({provider_refund_id:refund.id,refund_status:refundStatus,refund_requested_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id)
    if(updateError)throw updateError
    if(refundStatus==='refunded'){
      const{error:applyError}=await admin.rpc('apply_housing_refund',{p_payment_id:id,p_provider_refund_id:refund.id})
      if(applyError)throw applyError
    }
    await audit(admin,user.email,'housing_refund_started',{payment_id:id,provider_payment_id:payment.provider_payment_id,refund_id:refund.id,status:refundStatus,amount:payment.amount},payment.user_id)
    revalidatePath(path)
  }catch(error){go(path,{error:error instanceof Error?error.message:'Refund starten mislukt.'})}
  go(path,{saved:'refund'})
}

export async function syncHousingRefund(formData:FormData){
  const path='/atlas/payments',id=clean(formData.get('payment_id'),80)
  const {admin,user}=await assertAtlasPermission('payments',path)
  try{
    const{data:payment,error}=await admin.from('payments').select('*').eq('id',id).single()
    if(error||!payment?.provider_payment_id||!payment.provider_refund_id)throw new Error('Refundgegevens ontbreken.')
    const refund=await mollie(`/payments/${encodeURIComponent(payment.provider_payment_id)}/refunds/${encodeURIComponent(payment.provider_refund_id)}`)
    const status=String(refund.status||'pending')
    await admin.from('payments').update({refund_status:status,updated_at:new Date().toISOString()}).eq('id',id)
    if(status==='refunded'){
      const{error:applyError}=await admin.rpc('apply_housing_refund',{p_payment_id:id,p_provider_refund_id:payment.provider_refund_id})
      if(applyError)throw applyError
    }
    await audit(admin,user.email,'housing_refund_synced',{payment_id:id,status},payment.user_id)
    revalidatePath(path)
  }catch(error){go(path,{error:error instanceof Error?error.message:'Refund synchroniseren mislukt.'})}
  go(path,{saved:'sync'})
}

export async function setPrivacyRequestStatus(formData:FormData){
  const path='/atlas/privacy',id=clean(formData.get('id'),80),status=clean(formData.get('status'),20)
  const {admin,user}=await assertAtlasPermission('privacy',path)
  try{
    if(!validUuid(id)||!['open','reviewing','completed','rejected'].includes(status))throw new Error('Ongeldige verzoekstatus.')
    const payload={status,handled_by:['completed','rejected'].includes(status)?user.email:null,handled_at:['completed','rejected'].includes(status)?new Date().toISOString():null,updated_at:new Date().toISOString()}
    const{data:request,error}=await admin.from('privacy_requests').update(payload).eq('id',id).select('user_id,request_type').single()
    if(error||!request)throw error||new Error('Privacyverzoek niet gevonden.')
    await audit(admin,user.email,'privacy_request_status',{request_id:id,status,request_type:request.request_type},request.user_id)
    revalidatePath(path)
  }catch(error){go(path,{error:error instanceof Error?error.message:'Privacyverzoek bijwerken mislukt.'})}
  go(path,{saved:'privacy'})
}
