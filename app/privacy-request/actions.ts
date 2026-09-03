'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requestAccountDeletion(formData:FormData){
  const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser()
  if(!user)redirect('/login?next=/privacy-request')
  const confirmation=String(formData.get('confirmation')||'').trim(),reason=String(formData.get('reason')||'').trim().slice(0,1000)
  if(confirmation!=='VERWIJDEREN')redirect('/privacy-request?error=Typ+VERWIJDEREN+om+je+verzoek+te+bevestigen')
  const{error}=await supabase.from('privacy_requests').insert({user_id:user.id,request_type:'deletion',status:'open',reason:reason||null})
  if(error)redirect(`/privacy-request?error=${encodeURIComponent(error.code==='23505'?'Je hebt al een openstaand verwijderverzoek.':error.message)}`)
  revalidatePath('/privacy-request');redirect('/privacy-request?requested=1')
}
