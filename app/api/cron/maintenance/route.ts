import { NextRequest,NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
export async function GET(req:NextRequest){const secret=process.env.CRON_SECRET;if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Unauthorized'},{status:401});const admin=createAdminClient();if(!admin)return NextResponse.json({error:'Not configured'},{status:500});const{data,error}=await admin.rpc('run_daily_maintenance');if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({ok:true,...data})}
