'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertAtlasPermission } from '@/lib/atlas-auth'

const clean=(value:FormDataEntryValue|null,limit=500)=>typeof value==='string'?value.trim().slice(0,limit):''
const validUuid=(value:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

function back(values:Record<string,string>){const params=new URLSearchParams(values);redirect(`/atlas/users?${params.toString()}`)}
async function targetEmail(admin:any,userId:string){const{data}=await admin.auth.admin.getUserById(userId);return data?.user?.email||userId}
async function audit(admin:any,actor:string|null|undefined,action:string,target:string,details:Record<string,unknown>){await admin.from('atlas_staff_audit_logs').insert({action,actor_email:actor||null,target_email:target,details})}

export async function updateAtlasUser(formData:FormData){
  const path='/atlas/users',userId=clean(formData.get('user_id'),80),query=clean(formData.get('q'),100),mode=clean(formData.get('display_name_mode'),20)==='custom'?'custom':'system',custom=clean(formData.get('custom_display_name'),30),phone=clean(formData.get('phone'),30),searchStatus=clean(formData.get('search_status'),20)
  const{admin,user}=await assertAtlasPermission('users',path)
  try{
    if(!validUuid(userId))throw new Error('Gebruiker ontbreekt.')
    if(mode==='custom'){
      if(custom.length<3)throw new Error('De eigen weergavenaam moet minimaal 3 tekens hebben.')
      if(/^ruiler#/i.test(custom)||/@|https?:|www\.|\b\d{8,}\b/i.test(custom)||/asorta|support|admin|woningcorporatie|geverifieerd|✓/i.test(custom))throw new Error('Deze weergavenaam is niet toegestaan.')
    }
    const{error}=await admin.from('profiles').update({display_name_mode:mode,custom_display_name:mode==='custom'?custom:null,phone:phone||null,onboarding_completed:formData.get('onboarding_completed')==='on',updated_at:new Date().toISOString()}).eq('id',userId)
    if(error)throw error
    if(['active','paused'].includes(searchStatus)){
      const{error:searchError}=await admin.from('search_profiles').update({status:searchStatus,updated_at:new Date().toISOString()}).eq('user_id',userId)
      if(searchError)throw searchError
    }
    const email=await targetEmail(admin,userId)
    await audit(admin,user.email,'housing_user_profile_updated',email,{user_id:userId,display_name_mode:mode,search_status:searchStatus||null,onboarding_completed:formData.get('onboarding_completed')==='on'})
    revalidatePath(path);revalidatePath('/account');revalidatePath('/profile')
  }catch(error){back({error:error instanceof Error?error.message:'Gebruiker bijwerken mislukt.',q:query})}
  back({saved:'profile',q:query})
}

export async function setAtlasUserBlock(formData:FormData){
  const path='/atlas/users',userId=clean(formData.get('user_id'),80),query=clean(formData.get('q'),100),blocked=clean(formData.get('blocked'),8)==='true',reason=clean(formData.get('reason'),500),confirmation=clean(formData.get('confirmation'),30)
  const{admin,user}=await assertAtlasPermission('users',path)
  try{
    if(!validUuid(userId))throw new Error('Gebruiker ontbreekt.')
    if(userId===user.id)throw new Error('Je kunt je eigen beheeraccount niet blokkeren.')
    if(blocked&&confirmation!=='BLOKKEREN')throw new Error('Typ BLOKKEREN om het account te blokkeren.')
    if(blocked&&reason.length<5)throw new Error('Leg kort vast waarom het account wordt geblokkeerd.')
    const{error}=await admin.rpc('set_user_platform_block',{p_user_id:userId,p_blocked:blocked,p_reason:blocked?reason:null})
    if(error)throw error
    const email=await targetEmail(admin,userId)
    await audit(admin,user.email,blocked?'housing_user_blocked':'housing_user_unblocked',email,{user_id:userId,reason:blocked?reason:null})
    revalidatePath(path);revalidatePath('/atlas/housing');revalidatePath('/');revalidatePath('/homes')
  }catch(error){back({error:error instanceof Error?error.message:'Accountstatus bijwerken mislukt.',q:query})}
  back({saved:blocked?'blocked':'unblocked',q:query})
}
