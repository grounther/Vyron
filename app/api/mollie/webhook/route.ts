import { NextRequest, NextResponse } from "next/server";
import { mollie, fulfillHousingPayment } from "@/lib/mollie";
import { createAdminClient } from "@/lib/supabase/admin";
export async function POST(req: NextRequest) {
  const form = await req.formData(),
    id = String(form.get("id") || "");
  if (!id) return new NextResponse("ok");
  try {
    const payment = await mollie(`/payments/${encodeURIComponent(id)}`);
    const housingPaymentId=String(payment.metadata?.payment_id||'')
    if(payment.metadata?.kind==='housing_access'&&housingPaymentId){
      if(payment.status==='paid')await fulfillHousingPayment(housingPaymentId,id)
      else if(['failed','canceled','expired'].includes(payment.status))await createAdminClient()?.from('payments').update({status:payment.status,updated_at:new Date().toISOString()}).eq('id',housingPaymentId).in('status',['open','pending'])
    }
  } catch (e) {
    console.error("Mollie webhook", e);
    return new NextResponse("retry", { status: 500 });
  }
  return new NextResponse("ok");
}
