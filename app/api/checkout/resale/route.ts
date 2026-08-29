import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mollie, releaseResaleOrder } from "@/lib/mollie";
export async function POST(req: NextRequest) {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser(),
    form = await req.formData(),
    listingId = String(form.get("listing_id") || ""),
    back = String(form.get("return_to") || "/events");
  if (!user)
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(back)}`, req.url),
      303,
    );
  let orderId = "";
  try {
    const { data, error } = await s.rpc("reserve_resale_listing", {
      p_listing_id: listingId,
    });
    if (error) throw error;
    orderId = String(data.order_id);
    const total = Number(data.total),
      origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const payment = await mollie("/payments", {
      method: "POST",
      body: JSON.stringify({
        amount: { currency: "EUR", value: total.toFixed(2) },
        description: `Doorverkoop — ${data.event_title} — ${data.ticket_type}`,
        redirectUrl: `${origin}/resale/orders/${orderId}`,
        webhookUrl: `${origin}/api/mollie/webhook`,
        metadata: { kind: "resale", order_id: orderId },
      }),
    });
    const admin = createAdminClient();
    const { error: updateError } = await admin!
      .from("ticket_resale_orders")
      .update({
        mollie_payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    if (updateError) throw updateError;
    return NextResponse.redirect(payment._links.checkout.href, 303);
  } catch (e) {
    if (orderId) await releaseResaleOrder(orderId, "failed");
    return NextResponse.redirect(
      new URL(
        `${back}?error=${encodeURIComponent(e instanceof Error ? e.message : "Doorverkoop afrekenen mislukt.")}`,
        req.url,
      ),
      303,
    );
  }
}
