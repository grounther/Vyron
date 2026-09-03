import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(){
  const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser()
  if(!user)return NextResponse.redirect(new URL('/login?next=/privacy-request',process.env.NEXT_PUBLIC_SITE_URL||'https://asorta.nl'))
  const admin=createAdminClient()
  if(!admin)return NextResponse.json({error:'Export is tijdelijk niet beschikbaar.'},{status:503})

  const[{data:profile},{data:listings=[]},{data:searchProfile},{data:passes=[]},{data:payments=[]},{data:notifications=[]},{data:matches=[]},{data:residences=[]},{data:reports=[]}]=await Promise.all([
    admin.from('profiles').select('*').eq('id',user.id).maybeSingle(),
    admin.from('listings').select('*').eq('user_id',user.id),
    admin.from('search_profiles').select('*,search_locations(*),search_property_types(*)').eq('user_id',user.id).maybeSingle(),
    admin.from('access_passes').select('*').eq('user_id',user.id),
    admin.from('payments').select('*').eq('user_id',user.id),
    admin.from('notifications').select('*').eq('user_id',user.id),
    admin.from('matches').select('*').or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`),
    admin.from('user_residences').select('*').eq('user_id',user.id),
    admin.from('reports').select('*').eq('reporter_id',user.id),
  ])
  const matchIds=(matches||[]).map((x:any)=>x.id),{data:conversations=[]}=matchIds.length?await admin.from('conversations').select('*').in('match_id',matchIds):{data:[]}
  const conversationIds=(conversations||[]).map((x:any)=>x.id),{data:messages=[]}=conversationIds.length?await admin.from('messages').select('*').in('conversation_id',conversationIds):{data:[]}
  const now=new Date().toISOString()
  const{data:open}=await admin.from('privacy_requests').select('id').eq('user_id',user.id).eq('request_type','export').in('status',['open','reviewing']).maybeSingle()
  if(open)await admin.from('privacy_requests').update({status:'completed',handled_by:'automatic-export',handled_at:now,updated_at:now}).eq('id',open.id)
  else await admin.from('privacy_requests').insert({user_id:user.id,request_type:'export',status:'completed',handled_by:'automatic-export',handled_at:now})
  const body={exported_at:now,account:{id:user.id,email:user.email,created_at:user.created_at},profile,listings,search_profile:searchProfile,access_passes:passes,payments,notifications,matches,conversations,messages,residences,reports}
  return new NextResponse(JSON.stringify(body,null,2),{headers:{'content-type':'application/json; charset=utf-8','content-disposition':`attachment; filename="asorta-gegevens-${now.slice(0,10)}.json"`,'cache-control':'no-store'}})
}
