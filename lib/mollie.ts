import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const api = "https://api.mollie.com/v2";
export async function mollie(path: string, init?: RequestInit) {
  const key = process.env.MOLLIE_API_KEY;
  if (!key)
    throw new Error(
      "MOLLIE_API_KEY ontbreekt. Voeg eerst je Mollie test API-key toe in Vercel.",
    );
  const response = await fetch(`${api}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body?.detail || body?.title || "Mollie-verzoek mislukt.");
  return body;
}

export async function fulfillResaleOrder(orderId: string, paymentId: string) {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase service key ontbreekt.");
  const { data: order, error } = await admin
    .from("ticket_resale_orders")
    .select("id,status,mollie_payment_id")
    .eq("id", orderId)
    .single();
  if (error || !order) throw new Error("Doorverkooporder niet gevonden.");
  if (order.status === "paid") return order;
  const payment = await mollie(`/payments/${encodeURIComponent(paymentId)}`);
  if (payment.status !== "paid") return order;
  if (
    payment.metadata?.kind !== "resale" ||
    payment.metadata?.order_id !== orderId
  )
    throw new Error("Betalingsreferentie klopt niet.");
  const { error: finalizeError } = await admin.rpc("finalize_resale_order", {
    p_order_id: orderId,
    p_payment_id: paymentId,
  });
  if (finalizeError) throw finalizeError;
  return { ...order, status: "paid" };
}

export async function releaseResaleOrder(
  orderId: string,
  status: "failed" | "cancelled" | "expired",
) {
  const admin = createAdminClient();
  if (!admin) return;
  const { error } = await admin.rpc("release_resale_order", {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) console.error("Resale release failed", error.message);
}

export async function fulfillOrder(orderId: string, paymentId: string) {
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase service key ontbreekt.");
  const { data: order, error } = await admin
    .from("ticket_orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (error || !order) throw new Error("Bestelling niet gevonden.");
  if (order.status === "paid" || order.status === "processing") return order;
  const payment = await mollie(`/payments/${encodeURIComponent(paymentId)}`);
  if (payment.status !== "paid") return order;
  if (payment.metadata?.order_id !== orderId)
    throw new Error("Betalingsreferentie klopt niet.");
  const { data: claimed } = await admin
    .from("ticket_orders")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (!claimed) return order;
  try {
    const { count } = await admin
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("ticket_type_id", order.ticket_type_id)
      .not("status", "in", '("cancelled","refunded")');
    const { data: type } = await admin
      .from("ticket_types")
      .select("capacity")
      .eq("id", order.ticket_type_id)
      .single();
    if (!type || Number(count || 0) + order.quantity > type.capacity)
      throw new Error(
        "Onvoldoende ticketcapaciteit. Neem contact op met support.",
      );
    const tickets = Array.from({ length: order.quantity }, () => {
      const token = randomBytes(32).toString("hex");
      return {
        ticket_type_id: order.ticket_type_id,
        owner_id: order.buyer_id,
        order_id: order.id,
        token_hash: createHash("sha256").update(token).digest("hex"),
        status: "valid",
      };
    });
    const { error: ticketError } = await admin.from("tickets").insert(tickets);
    if (ticketError) throw ticketError;
    const { error: updateError } = await admin
      .from("ticket_orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("status", "processing");
    if (updateError) throw updateError;
    return { ...order, status: "paid" };
  } catch (e) {
    await admin
      .from("ticket_orders")
      .update({ status: "pending", updated_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("status", "processing");
    throw e;
  }
}
