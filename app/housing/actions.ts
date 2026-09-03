'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const clean=(v:FormDataEntryValue|null,n=500)=>typeof v==='string'?v.trim().slice(0,n):''
const number=(v:FormDataEntryValue|null)=>{const raw=clean(v,30).replace(',','.');if(!raw)return null;const parsed=Number(raw);return Number.isFinite(parsed)?parsed:null}
const go=(path:string,key:string,value:string)=>redirect(`${path}?${key}=${encodeURIComponent(value)}`)
const validUuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

async function session(next:string){
  const supabase=await createClient()
  const {data:{user}}=await supabase.auth.getUser()
  if(!user)redirect(`/login?next=${encodeURIComponent(next)}`)
  return {supabase,user}
}

async function hasPaidSearchAccess(supabase:any,userId:string){
  const{data}=await supabase.from('access_passes').select('id').eq('user_id',userId).eq('status','active').gt('expires_at',new Date().toISOString()).maybeSingle()
  return Boolean(data)
}

async function canUseConversation(supabase:any,userId:string,matchId:string){
  if(await hasPaidSearchAccess(supabase,userId))return true
  const{data}=await supabase.from('matches').select('status').eq('id',matchId).maybeSingle()
  return Boolean(data&&['swap_in_progress','completed'].includes(data.status))
}

function paidAccessRequired(next:string){
  redirect(`/checkout-access?purpose=search_year&next=${encodeURIComponent(next)}&error=${encodeURIComponent('Activeer eerst je zoekpas voor €5 om contact te leggen of op deze match te reageren.')}`)
}

export async function updateProfile(formData:FormData){
  const {supabase,user}=await session('/profile')
  try{
    const mode=clean(formData.get('display_name_mode'),12)==='custom'?'custom':'system'
    const custom=clean(formData.get('custom_display_name'),30)
    if(mode==='custom'){
      if(custom.length<3)throw new Error('Kies een weergavenaam van minimaal 3 tekens.')
      if(/^ruiler#/i.test(custom)||/@|https?:|www\.|\b\d{8,}\b/i.test(custom))throw new Error('Deze weergavenaam is niet toegestaan.')
      if(/asorta|support|admin|woningcorporatie|geverifieerd|✓/i.test(custom))throw new Error('Deze naam kan met een officiële rol worden verward.')
    }
    const {error}=await supabase.from('profiles').update({display_name_mode:mode,custom_display_name:mode==='custom'?custom:null,phone:clean(formData.get('phone'),30)||null,onboarding_completed:true,updated_at:new Date().toISOString(),last_active_at:new Date().toISOString()}).eq('id',user.id)
    if(error)throw error
    revalidatePath('/profile');revalidatePath('/account')
  }catch(e){go('/profile','error',e instanceof Error?e.message:'Profiel opslaan mislukt.')}
  redirect('/profile?saved=1')
}

export async function suggestHousingProvider(formData:FormData){
  const {supabase,user}=await session('/place-home')
  const name=clean(formData.get('provider_name'),160),website=clean(formData.get('provider_website'),300),contact=clean(formData.get('provider_contact'),500)
  if(name.length<2)go('/place-home','error','Vul de naam van je verhuurder in.')
  const{error}=await supabase.from('housing_provider_suggestions').insert({submitted_by:user.id,name,website_url:website||null,contact_details:contact||null,status:'pending'})
  if(error)go('/place-home','error',error.message)
  redirect('/place-home?provider_suggested=1')
}

export async function createHousingListing(formData:FormData){
  const {supabase,user}=await session('/place-home')
  let listingId=''
  try{
    const rent=number(formData.get('monthly_rent')), rooms=number(formData.get('rooms')), livingArea=number(formData.get('living_area_m2'))
    const provider=clean(formData.get('housing_provider_id'),80), description=clean(formData.get('description'),3000), postcode4=clean(formData.get('postcode4'),4).replace(/\D/g,'')
    if(!provider)throw new Error('Kies je woningcorporatie of verhuurder.')
    if(!/^[1-9][0-9]{3}$/.test(postcode4))throw new Error('Vul de eerste vier cijfers van je postcode in.')
    if(rent===null||rent<=0||rooms===null||rooms<1)throw new Error('Controleer de huurprijs en het aantal kamers.')
    if(description.length<30)throw new Error('Beschrijf je woning in minimaal 30 tekens.')
    const payload={
      user_id:user.id,housing_provider_id:provider,status:'draft',property_type:clean(formData.get('property_type'),30),province:clean(formData.get('province'),80),municipality:clean(formData.get('municipality'),100),city:clean(formData.get('city'),100),district:clean(formData.get('district'),100)||null,postcode4,street:clean(formData.get('street'),160),house_number:clean(formData.get('house_number'),30),monthly_rent:rent,service_costs:number(formData.get('service_costs'))||0,living_area_m2:livingArea,rooms,bedrooms:number(formData.get('bedrooms')),floor:number(formData.get('floor')),has_garden:formData.get('has_garden')==='on',has_balcony:formData.get('has_balcony')==='on',has_elevator:formData.get('has_elevator')==='on',ground_floor:formData.get('ground_floor')==='on',wheelchair_accessible:formData.get('wheelchair_accessible')==='on',accessibility:clean(formData.get('accessibility'),500)||null,household_size:number(formData.get('household_size')),description,available_from:clean(formData.get('available_from'),10)||null,
    }
    if(!payload.province||!payload.municipality||!payload.city||!payload.street||!payload.house_number)throw new Error('Vul alle verplichte adresvelden in. Alleen plaats, wijk en provincie worden openbaar.')
    const {data,error}=await supabase.from('listings').insert(payload).select('id').single()
    if(error||!data)throw error||new Error('Woning kon niet worden opgeslagen.')
    listingId=data.id
    const photos=formData.getAll('photos').filter((f):f is File=>f instanceof File&&f.size>0).slice(0,8)
    if(!photos.length)throw new Error('Voeg minimaal één duidelijke woningfoto toe.')
    for(let i=0;i<photos.length;i++){
      const photo=photos[i]
      if(photo.size>10*1024*1024)throw new Error('Een foto mag maximaal 10 MB zijn.')
      if(!['image/jpeg','image/png','image/webp'].includes(photo.type))throw new Error('Gebruik JPG, PNG of WebP voor woningfoto\'s.')
      const ext=photo.type==='image/png'?'png':photo.type==='image/webp'?'webp':'jpg'
      const path=`${user.id}/${listingId}/${crypto.randomUUID()}.${ext}`
      const {error:uploadError}=await supabase.storage.from('listing-photos').upload(path,await photo.arrayBuffer(),{contentType:photo.type,upsert:false})
      if(uploadError)throw uploadError
      const {error:photoError}=await supabase.from('listing_photos').insert({listing_id:listingId,storage_path:path,position:i,alt_text:`Woningfoto ${i+1}`})
      if(photoError)throw photoError
    }
    const {error:statusError}=await supabase.from('listings').update({status:'pending_payment',updated_at:new Date().toISOString()}).eq('id',listingId)
    if(statusError)throw statusError
  }catch(e){
    if(listingId)await supabase.from('listings').delete().eq('id',listingId).eq('status','draft')
    go('/place-home','error',e instanceof Error?e.message:'Woning opslaan mislukt.')
  }
  redirect(`/checkout-access?purpose=listing_activation&listing=${listingId}`)
}

export async function updateHousingListing(formData:FormData){
  const listingId=clean(formData.get('listing_id'),80),{supabase,user}=await session('/edit-home')
  const uploadedPaths:string[]=[]
  try{
    if(!validUuid(listingId))throw new Error('Woning ontbreekt.')
    const[{data:listing},{data:provider},{data:existingPhotos=[]}]=await Promise.all([
      supabase.from('listings').select('id,status,blocked_at').eq('id',listingId).eq('user_id',user.id).maybeSingle(),
      supabase.from('housing_providers').select('id').eq('id',clean(formData.get('housing_provider_id'),80)).eq('active',true).maybeSingle(),
      supabase.from('listing_photos').select('id,position').eq('listing_id',listingId),
    ])
    if(!listing)throw new Error('Deze woning is niet gevonden of hoort niet bij jouw account.')
    if(!['draft','pending_payment','active','paused'].includes(listing.status))throw new Error('Deze woning kan tijdens een lopend of afgerond ruilproces niet worden gewijzigd.')
    if(listing.blocked_at)throw new Error('Deze woning is door ASORTA geblokkeerd en kan nu niet worden gewijzigd.')
    if(!provider)throw new Error('Kies een geldige woningcorporatie of verhuurder.')

    const rent=number(formData.get('monthly_rent')),rooms=number(formData.get('rooms')),livingArea=number(formData.get('living_area_m2')),description=clean(formData.get('description'),3000),postcode4=clean(formData.get('postcode4'),4).replace(/\D/g,'')
    if(!/^[1-9][0-9]{3}$/.test(postcode4))throw new Error('Vul de eerste vier cijfers van je postcode in.')
    if(rent===null||rent<=0||rooms===null||rooms<1)throw new Error('Controleer de huurprijs en het aantal kamers.')
    if(livingArea!==null&&(livingArea<10||livingArea>1000))throw new Error('Het woonoppervlak moet tussen 10 en 1000 m² liggen.')
    if(description.length<30)throw new Error('Beschrijf je woning in minimaal 30 tekens.')
    const payload={housing_provider_id:provider.id,property_type:clean(formData.get('property_type'),30),province:clean(formData.get('province'),80),municipality:clean(formData.get('municipality'),100),city:clean(formData.get('city'),100),district:clean(formData.get('district'),100)||null,postcode4,street:clean(formData.get('street'),160),house_number:clean(formData.get('house_number'),30),monthly_rent:rent,service_costs:number(formData.get('service_costs'))||0,living_area_m2:livingArea,rooms,bedrooms:number(formData.get('bedrooms')),floor:number(formData.get('floor')),has_garden:formData.get('has_garden')==='on',has_balcony:formData.get('has_balcony')==='on',has_elevator:formData.get('has_elevator')==='on',ground_floor:formData.get('ground_floor')==='on',wheelchair_accessible:formData.get('wheelchair_accessible')==='on',accessibility:clean(formData.get('accessibility'),500)||null,household_size:number(formData.get('household_size')),description,available_from:clean(formData.get('available_from'),10)||null,updated_at:new Date().toISOString()}
    if(!payload.province||!payload.municipality||!payload.city||!payload.street||!payload.house_number)throw new Error('Vul alle verplichte adresvelden in. Alleen plaats, wijk en provincie worden openbaar.')
    if(!['apartment','house','maisonette','studio','senior','other'].includes(payload.property_type))throw new Error('Kies een geldig woningtype.')

    const photos=formData.getAll('photos').filter((file):file is File=>file instanceof File&&file.size>0)
    if((existingPhotos||[]).length+photos.length>8)throw new Error(`Je advertentie mag maximaal 8 foto's bevatten. Je kunt nu nog ${Math.max(0,8-(existingPhotos||[]).length)} foto('s) toevoegen.`)
    const highestPosition=(existingPhotos||[]).reduce((highest:number,photo:any)=>Math.max(highest,Number(photo.position)||0),-1)
    for(let i=0;i<photos.length;i++){
      const photo=photos[i]
      if(photo.size>10*1024*1024)throw new Error('Een foto mag maximaal 10 MB zijn.')
      if(!['image/jpeg','image/png','image/webp'].includes(photo.type))throw new Error('Gebruik JPG, PNG of WebP voor woningfoto\'s.')
      const ext=photo.type==='image/png'?'png':photo.type==='image/webp'?'webp':'jpg',path=`${user.id}/${listingId}/${crypto.randomUUID()}.${ext}`
      const{error:uploadError}=await supabase.storage.from('listing-photos').upload(path,await photo.arrayBuffer(),{contentType:photo.type,upsert:false})
      if(uploadError)throw uploadError
      uploadedPaths.push(path)
      const{error:photoError}=await supabase.from('listing_photos').insert({listing_id:listingId,storage_path:path,position:highestPosition+i+1,alt_text:`Woningfoto ${(existingPhotos||[]).length+i+1}`,moderation_status:'pending'})
      if(photoError)throw photoError
    }

    const admin=createAdminClient()
    if(!admin)throw new Error('De woning kan momenteel niet veilig worden bijgewerkt.')
    const{data:updated,error:updateError}=await admin.from('listings').update(payload).eq('id',listingId).eq('user_id',user.id).in('status',['draft','pending_payment','active','paused']).select('id').maybeSingle()
    if(updateError||!updated)throw updateError||new Error('De woning kon niet worden bijgewerkt.')
    revalidatePath('/account');revalidatePath('/edit-home');revalidatePath('/homes');revalidatePath(`/homes/${listingId}`);revalidatePath('/')
  }catch(error){
    if(uploadedPaths.length){await supabase.from('listing_photos').delete().in('storage_path',uploadedPaths);await supabase.storage.from('listing-photos').remove(uploadedPaths)}
    go('/edit-home','error',error instanceof Error?error.message:'Advertentie bijwerken mislukt.')
  }
  redirect(`/edit-home?saved=1${uploadedPaths.length?'&photos=pending':''}`)
}

export async function removeListingPhoto(formData:FormData){
  const photoId=clean(formData.get('photo_id'),80),{supabase,user}=await session('/edit-home')
  try{
    if(!validUuid(photoId))throw new Error('Foto ontbreekt.')
    const{data:photo}=await supabase.from('listing_photos').select('id,listing_id,storage_path').eq('id',photoId).maybeSingle()
    if(!photo)throw new Error('Deze foto is niet gevonden of hoort niet bij jouw woning.')
    const[{data:listing},{count:photoCount}]=await Promise.all([supabase.from('listings').select('id,status').eq('id',photo.listing_id).eq('user_id',user.id).maybeSingle(),supabase.from('listing_photos').select('*',{count:'exact',head:true}).eq('listing_id',photo.listing_id)])
    if(!listing||!['draft','pending_payment','active','paused'].includes(listing.status))throw new Error('Deze foto kan nu niet worden verwijderd.')
    if((photoCount||0)<=1)throw new Error('Voeg eerst een nieuwe foto toe voordat je de laatste woningfoto verwijdert.')
    const{error:deleteError}=await supabase.from('listing_photos').delete().eq('id',photo.id)
    if(deleteError)throw deleteError
    await supabase.storage.from('listing-photos').remove([photo.storage_path])
    revalidatePath('/edit-home');revalidatePath('/homes');revalidatePath(`/homes/${photo.listing_id}`);revalidatePath('/')
  }catch(error){go('/edit-home','error',error instanceof Error?error.message:'Foto verwijderen mislukt.')}
  redirect('/edit-home?photo_removed=1')
}

export async function saveSearchProfile(formData:FormData){
  const {supabase}=await session('/search-profile')
  try{
    const locations=clean(formData.get('locations'),500).split(',').map(x=>x.trim()).filter(Boolean).slice(0,12)
    const propertyTypes=formData.getAll('property_types').map(x=>String(x)).filter(Boolean),minRent=number(formData.get('min_rent')),maxRent=number(formData.get('max_rent'))
    if(!locations.length)throw new Error('Vul minimaal één gewenste plaats of gemeente in.')
    if(minRent!==null&&maxRent!==null&&maxRent<minRent)throw new Error('De maximale huur kan niet lager zijn dan de minimale huur.')
    const {error}=await supabase.rpc('save_search_profile',{p_locations:locations,p_property_types:propertyTypes,p_min_rent:minRent,p_max_rent:maxRent,p_min_rooms:number(formData.get('min_rooms')),p_min_bedrooms:number(formData.get('min_bedrooms')),p_min_living_area_m2:number(formData.get('min_living_area_m2')),p_garden_required:formData.get('garden_required')==='on',p_balcony_required:formData.get('balcony_required')==='on',p_elevator_required:formData.get('elevator_required')==='on',p_ground_floor_required:formData.get('ground_floor_required')==='on',p_wheelchair_required:formData.get('wheelchair_required')==='on',p_notes:clean(formData.get('notes'),1000)||null})
    if(error)throw error
    revalidatePath('/search-profile');revalidatePath('/account')
  }catch(e){go('/search-profile','error',e instanceof Error?e.message:'Zoekprofiel opslaan mislukt.')}
  redirect('/search-profile?saved=1')
}

export async function decideMatch(formData:FormData){
  const id=clean(formData.get('match_id'),80),decision=clean(formData.get('decision'),10)
  const {supabase,user}=await session(`/matches/${id}`)
  if(!await hasPaidSearchAccess(supabase,user.id))paidAccessRequired(`/matches/${id}`)
  const {error}=await supabase.rpc('set_match_decision',{p_match_id:id,p_decision:decision})
  if(error)go(`/matches/${id}`,'error',error.message)
  revalidatePath(`/matches/${id}`);revalidatePath('/matches');redirect(`/matches/${id}?decision=${decision}`)
}

export async function sendMatchMessage(formData:FormData){
  const matchId=clean(formData.get('match_id'),80),conversationId=clean(formData.get('conversation_id'),80),body=clean(formData.get('body'),2000)
  const {supabase,user}=await session(`/matches/${matchId}`)
  if(!await canUseConversation(supabase,user.id,matchId))paidAccessRequired(`/matches/${matchId}#chat`)
  if(!body)go(`/matches/${matchId}`,'error','Schrijf eerst een bericht.')
  const {error}=await supabase.from('messages').insert({conversation_id:conversationId,sender_id:user.id,body})
  if(error)go(`/matches/${matchId}`,'error',error.message)
  await supabase.from('conversations').update({last_message_at:new Date().toISOString()}).eq('id',conversationId)
  revalidatePath(`/matches/${matchId}`);redirect(`/matches/${matchId}#chat`)
}

export async function reportMatchUser(formData:FormData){
  const matchId=clean(formData.get('match_id'),80),reason=clean(formData.get('reason'),160),details=clean(formData.get('details'),1500)
  const {supabase,user}=await session(`/matches/${matchId}`)
  if(reason.length<3)go(`/matches/${matchId}`,'error','Kies of beschrijf een reden voor je melding.')
  const[{data:match},{data:conversation}]=await Promise.all([supabase.from('matches').select('*').eq('id',matchId).maybeSingle(),supabase.from('conversations').select('id').eq('match_id',matchId).maybeSingle()])
  if(!match)go(`/matches/${matchId}`,'error','Match niet gevonden.')
  const reportedUserId=match.user_a_id===user.id?match.user_b_id:match.user_a_id
  const listingId=match.user_a_id===user.id?match.listing_b_id:match.listing_a_id
  const{error}=await supabase.from('reports').insert({reporter_id:user.id,reported_user_id:reportedUserId,listing_id:listingId,conversation_id:conversation?.id||null,reason,details:details||null,status:'open'})
  if(error)go(`/matches/${matchId}`,'error',error.message)
  redirect(`/matches/${matchId}?reported=1`)
}

export async function blockMatchUser(formData:FormData){
  const matchId=clean(formData.get('match_id'),80),confirmation=clean(formData.get('confirmation'),30)
  const {supabase}=await session(`/matches/${matchId}`)
  if(confirmation!=='BLOKKEREN')go(`/matches/${matchId}`,'error','Typ BLOKKEREN om deze gebruiker te blokkeren.')
  const{error}=await supabase.rpc('block_match_user',{p_match_id:matchId})
  if(error)go(`/matches/${matchId}`,'error',error.message)
  revalidatePath('/matches');redirect('/matches?blocked=1')
}

export async function updateProviderProgress(formData:FormData){
  const matchId=clean(formData.get('match_id'),80),id=clean(formData.get('provider_status_id'),80),status=clean(formData.get('status'),30)
  const {supabase,user}=await session(`/matches/${matchId}`)
  const {error}=await supabase.from('swap_provider_status').update({status,updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',user.id)
  if(error)go(`/matches/${matchId}`,'error',error.message)
  revalidatePath(`/matches/${matchId}`);redirect(`/matches/${matchId}?progress=saved`)
}

export async function cancelSwap(formData:FormData){
  const matchId=clean(formData.get('match_id'),80),swapId=clean(formData.get('swap_case_id'),80)
  const {supabase}=await session(`/matches/${matchId}`)
  const {error}=await supabase.rpc('cancel_swap_case',{p_swap_case_id:swapId})
  if(error)go(`/matches/${matchId}`,'error',error.message)
  revalidatePath('/matches');redirect('/matches?cancelled=1')
}

export async function confirmSwapCompletion(formData:FormData){
  const matchId=clean(formData.get('match_id'),80),swapId=clean(formData.get('swap_case_id'),80)
  const {supabase}=await session(`/matches/${matchId}`)
  const {error}=await supabase.rpc('confirm_swap_completion',{p_swap_case_id:swapId})
  if(error)go(`/matches/${matchId}`,'error',error.message)
  revalidatePath(`/matches/${matchId}`);revalidatePath('/account');redirect(`/matches/${matchId}?completed=1`)
}

export async function markNotificationsRead(){
  const {supabase,user}=await session('/notifications')
  await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('user_id',user.id).is('read_at',null)
  revalidatePath('/notifications');revalidatePath('/account');redirect('/notifications?read=1')
}

export async function confirmListingAvailable(formData:FormData){
  const id=clean(formData.get('listing_id'),80),{supabase}=await session('/account')
  const{error}=await supabase.rpc('confirm_listing_available',{p_listing_id:id})
  if(error)go('/account','error',error.message)
  revalidatePath('/account');redirect('/account?confirmed=1')
}
