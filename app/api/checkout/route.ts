import { NextResponse } from 'next/server'
export async function POST(){
  // Plug-in point voor Mollie Checkout.
  // Later: maak payment met MOLLIE_API_KEY en redirect naar payment._links.checkout.href
  return NextResponse.json({status:'placeholder', message:'Mollie checkout wordt in de volgende stap gekoppeld.'})
}
