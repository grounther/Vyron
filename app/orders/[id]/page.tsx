import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fulfillOrder } from "@/lib/mollie";
export const dynamic = "force-dynamic";
export default async function OrderResult({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect(`/login?next=/orders/${id}`);
  let { data: o } = await s
    .from("ticket_orders")
    .select("*,ticket_events(title,starts_at,venue,city),ticket_types(name)")
    .eq("id", id)
    .eq("buyer_id", user.id)
    .maybeSingle();
  if (!o) notFound();
  if (o.status === "pending" && o.mollie_payment_id) {
    try {
      await fulfillOrder(o.id, o.mollie_payment_id);
      const refreshed = await s
        .from("ticket_orders")
        .select(
          "*,ticket_events(title,starts_at,venue,city),ticket_types(name)",
        )
        .eq("id", id)
        .single();
      o = refreshed.data || o;
    } catch {}
  }
  const paid = o.status === "paid",
    failed = ["failed", "cancelled", "expired"].includes(o.status);
  const Icon = paid ? CheckCircle2 : failed ? XCircle : Clock3;
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 py-16">
      <section className="card w-full rounded-[2rem] p-8 text-center">
        <Icon
          size={56}
          className={`mx-auto ${paid ? "text-[#b8ff5a]" : failed ? "text-red-400" : "text-amber-300"}`}
        />
        <h1 className="mt-5 text-4xl font-black">
          {paid
            ? "Betaling geslaagd"
            : failed
              ? "Betaling niet voltooid"
              : "Betaling wordt verwerkt"}
        </h1>
        <p className="mt-4 text-white/50">
          {paid
            ? "Je unieke tickets staan klaar in Mijn ASORTA."
            : failed
              ? "Er zijn geen tickets uitgegeven. Je kunt het opnieuw proberen."
              : "Ververs deze pagina over enkele ogenblikken."}
        </p>
        <div className="mt-7 rounded-2xl border border-white/10 p-5 text-left">
          <strong>{o.ticket_events?.title}</strong>
          <p className="mt-2 text-sm text-white/45">
            {o.quantity}× {o.ticket_types?.name} · €{" "}
            {Number(o.total).toFixed(2).replace(".", ",")}
          </p>
        </div>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/account" className="btn-primary">
            Mijn tickets
          </Link>
          <Link href="/events" className="btn-secondary">
            Evenementen
          </Link>
        </div>
      </section>
    </main>
  );
}
