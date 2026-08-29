import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mollie } from "@/lib/mollie";
export async function POST(req: NextRequest) {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  const form = await req.formData(),
    typeId = String(form.get("ticket_type_id") || ""),
    quantity = Math.min(10, Math.max(1, Number(form.get("quantity") || 1)));
  const back = String(form.get("return_to") || "/events");
  if (!user)
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(back)}`, req.url),
      303,
    );
  try {
    const { data: type, error } = await s
      .from("ticket_types")
      .select(
        "id,name,face_value,capacity,event_id,ticket_events!inner(id,title,status,slug,starts_at)",
      )
      .eq("id", typeId)
      .eq("ticket_events.status", "published")
      .single();
    if (error || !type) throw new Error("Dit ticket is niet beschikbaar.");
    const event = Array.isArray(type.ticket_events)
      ? type.ticket_events[0]
      : type.ticket_events;
    if (!event || new Date(event.starts_at).getTime() <= Date.now())
      throw new Error("De ticketverkoop voor dit evenement is gesloten.");
    const admin = (await import("@/lib/supabase/admin")).createAdminClient();
    const { count: sold } = admin
      ? await admin
          .from("tickets")
          .select("*", { count: "exact", head: true })
          .eq("ticket_type_id", type.id)
          .not("status", "in", '("cancelled","refunded")')
      : { count: 0 };
    if ((sold || 0) + quantity > Number(type.capacity))
      throw new Error(
        (sold || 0) >= Number(type.capacity)
          ? "Deze ticketsoort is uitverkocht."
          : `Er zijn nog maar ${Number(type.capacity) - (sold || 0)} tickets beschikbaar.`,
      );
    const subtotal = Number(type.face_value) * quantity,
      buyerFee = Math.round(subtotal * 0.085 * 100) / 100,
      total = subtotal + buyerFee;
    const { data: order, error: orderError } = await s
      .from("ticket_orders")
      .insert({
        buyer_id: user.id,
        event_id: type.event_id,
        ticket_type_id: type.id,
        quantity,
        subtotal,
        buyer_fee: buyerFee,
        total,
        status: "pending",
      })
      .select("id")
      .single();
    if (orderError) throw orderError;
    const origin = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const payment = await mollie("/payments", {
      method: "POST",
      body: JSON.stringify({
        amount: { currency: "EUR", value: total.toFixed(2) },
        description: `${quantity}× ${type.name} — ${event.title}`,
        redirectUrl: `${origin}/orders/${order.id}`,
        webhookUrl: `${origin}/api/mollie/webhook`,
        metadata: { order_id: order.id },
      }),
    });
    await admin
      ?.from("ticket_orders")
      .update({
        mollie_payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
    return NextResponse.redirect(payment._links.checkout.href, 303);
  } catch (e) {
    return NextResponse.redirect(
      new URL(
        `${back}?error=${encodeURIComponent(e instanceof Error ? e.message : "Afrekenen mislukt.")}`,
        req.url,
      ),
      303,
    );
  }
}
