import { NextRequest, NextResponse } from "next/server";
import {
  mollie,
  fulfillOrder,
  fulfillResaleOrder,
  releaseResaleOrder,
} from "@/lib/mollie";
import { createAdminClient } from "@/lib/supabase/admin";
export async function POST(req: NextRequest) {
  const form = await req.formData(),
    id = String(form.get("id") || "");
  if (!id) return new NextResponse("ok");
  try {
    const payment = await mollie(`/payments/${encodeURIComponent(id)}`),
      orderId = String(payment.metadata?.order_id || "");
    const resale = payment.metadata?.kind === "resale";
    if (orderId && payment.status === "paid") {
      if (resale) await fulfillResaleOrder(orderId, id);
      else await fulfillOrder(orderId, id);
    } else if (
      orderId &&
      ["failed", "canceled", "expired"].includes(payment.status)
    ) {
      const status =
        payment.status === "canceled" ? "cancelled" : payment.status;
      if (resale)
        await releaseResaleOrder(
          orderId,
          status as "failed" | "cancelled" | "expired",
        );
      else
        await createAdminClient()
          ?.from("ticket_orders")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .eq("status", "pending");
    }
  } catch (e) {
    console.error("Mollie webhook", e);
  }
  return new NextResponse("ok");
}
