import { NextResponse } from 'next/server'
import { products } from '@/lib/products'

export async function GET(){
  const inventoryValue = products.reduce((sum,p)=>sum + (p.cost || 0),0)
  return NextResponse.json({
    status:'ok',
    mode:'foundation',
    products: products.length,
    estimatedInventoryValue: Number(inventoryValue.toFixed(2)),
    next:['connect_supabase','add_auth','connect_payments','map_cj_variants']
  })
}
