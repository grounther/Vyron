import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fulfillResaleOrder } from "@/lib/mollie";
export const dynamic = "force-dynamic";
export default async function ResaleResult({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect(`/login?next=/resale/orders/${id}`);
  let { data: o } = await s
    .from("ticket_resale_orders")
    .select("*")
    .eq("id", id)
    .eq("buyer_id", user.id)
    .maybeSingle();
  if (!o) notFound();
  if (o.status === "pending" && o.mollie_payment_id) {
    try {
      await fulfillResaleOrder(o.id, o.mollie_payment_id);
      const refreshed = await s
        .from("ticket_resale_orders")
        .select("*")
        .eq("id", id)
        .single();
      o = refreshed.data || o;
    } catch {}
  }
  const paid = o.status === "paid",
    failed = ["failed", "cancelled", "expired"].includes(o.status),
    Icon = paid ? CheckCircle2 : failed ? XCircle : Clock3;
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-16">
      <section className="card w-full rounded-[2rem] p-8 text-center">
        <Icon
          size={60}
          className={`mx-auto ${paid ? "text-[#b8ff5a]" : failed ? "text-red-400" : "text-amber-300"}`}
        />
        <h1 className="mt-5 text-4xl font-black">
          {paid
            ? "Ticket overgedragen"
            : failed
              ? "Betaling niet voltooid"
              : "Betaling wordt verwerkt"}
        </h1>
        <p className="mt-4 text-white/50">
          {paid
            ? "De oude QR-code is ongeldig. Jouw nieuwe QR-ticket staat in Mijn ASORTA."
            : failed
              ? "Het ticket is weer beschikbaar voor andere kopers."
              : "De betaalbevestiging wordt gecontroleerd."}
        </p>
        <div className="mt-7 rounded-2xl border border-white/10 p-5">
          <p className="text-sm text-white/45">Betaald totaal</p>
          <strong className="mt-2 block text-3xl">
            € {Number(o.total).toFixed(2).replace(".", ",")}
          </strong>
        </div>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/account" className="btn-primary">
            Mijn nieuwe ticket
          </Link>
          <Link href="/events" className="btn-secondary">
            Evenementen
          </Link>
        </div>
      </section>
    </main>
  );
}
