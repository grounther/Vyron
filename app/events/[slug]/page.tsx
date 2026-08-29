import { notFound } from "next/navigation";
import Link from "next/link";
import { events, euro, buyerFeeRate } from "@/lib/tickets";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { eventCover } from "@/lib/event-images";
export const dynamic = "force-dynamic";
export default async function EventDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params,
    p = await searchParams,
    s = await createClient();
  const { data: db } = await s
    .from("ticket_events")
    .select(
      "id,slug,title,venue,city,starts_at,category,description,ticket_types(id,name,face_value,capacity)",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  const demo = events.find((x) => x.slug === slug);
  if (!db && !demo) notFound();
  await createAdminClient()?.rpc("expire_resale_reservations");
  const { data: resaleListings = [] } = db
    ? await s
        .from("ticket_listings")
        .select(
          "id,asking_price,buyer_fee_rate,tickets!inner(status,ticket_types!inner(name,event_id))",
        )
        .eq("status", "active")
        .eq("tickets.status", "listed")
        .eq("tickets.ticket_types.event_id", db.id)
        .order("asking_price", { ascending: true })
    : { data: [] as any[] };
  const title = db?.title || demo!.title,
    venue = db?.venue || demo!.venue,
    city = db?.city || demo!.city,
    date = db
      ? new Date(db.starts_at).toLocaleString("nl-NL", {
          dateStyle: "long",
          timeStyle: "short",
        })
      : demo!.date,
    category = db?.category || demo!.category,
    types = (db?.ticket_types || []).sort(
      (a: any, b: any) => Number(a.face_value) - Number(b.face_value),
    ),
    price = db ? (types[0] ? Number(types[0].face_value) : 0) : demo!.price,
    total = price * (1 + buyerFeeRate);
  const admin = createAdminClient();
  const soldByType = new Map<string, number>();
  if (admin && types.length) {
    const { data: issued = [] } = await admin
      .from("tickets")
      .select("ticket_type_id")
      .in(
        "ticket_type_id",
        types.map((t: any) => t.id),
      )
      .not("status", "in", '("cancelled","refunded")');
    for (const ticket of issued || [])
      soldByType.set(
        ticket.ticket_type_id,
        (soldByType.get(ticket.ticket_type_id) || 0) + 1,
      );
  }
  const availableTypes = types.filter(
    (t: any) => (soldByType.get(t.id) || 0) < Number(t.capacity),
  );
  const expired = Boolean(db && new Date(db.starts_at).getTime() <= Date.now());
  const soldOut = Boolean(db && types.length && !availableTypes.length);
  const closed = expired || soldOut;
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-14 sm:px-5">
      <Link
        href="/events"
        className="text-sm font-black text-white/45 hover:text-white"
      >
        ← Alle evenementen
      </Link>
      {p.error && (
        <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-red-100">
          {p.error}
        </div>
      )}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_.85fr]">
        <div
          className="min-h-[440px] rounded-[2rem] border border-white/10 bg-cover bg-center p-8"
          style={{
            backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.9)),url(${eventCover(category)})`,
          }}
        >
          <span className="rounded-full border border-white/15 bg-black/30 px-3 py-2 text-xs font-black uppercase tracking-[.2em]">
            {category}
          </span>
          <h1 className="mt-52 max-w-2xl text-4xl font-black sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 flex flex-wrap gap-5 text-sm text-white/55">
            <span className="flex items-center gap-2">
              <CalendarDays size={17} />
              {date}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={17} />
              {venue}, {city}
            </span>
          </p>
        </div>
        <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[.04] p-7">
          <span className="text-sm text-white/42">Beschikbaar vanaf</span>
          <strong className="mt-2 block text-4xl font-black">
            {euro(price)}
          </strong>
          {db && types.length && !closed ? (
            <form
              action="/api/checkout"
              method="post"
              className="mt-7 grid gap-4"
            >
              <input type="hidden" name="return_to" value={`/events/${slug}`} />
              <label className="grid gap-2 text-sm font-bold text-white/65">
                Ticketsoort
                <select name="ticket_type_id" className="support-input">
                  {availableTypes.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {euro(Number(t.face_value))}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-white/65">
                Aantal
                <select name="quantity" className="support-input">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <button className="w-full rounded-full bg-[#b8ff5a] px-6 py-4 font-black text-black">
                Veilig afrekenen
              </button>
            </form>
          ) : (
            <div className="mt-7 grid gap-3 border-y border-white/10 py-5 text-sm">
              <div className="flex justify-between text-white/55">
                <span>Ticket</span>
                <span>{euro(price)}</span>
              </div>
              <div className="flex justify-between text-white/55">
                <span>Servicekosten 8,5%</span>
                <span>{euro(price * buyerFeeRate)}</span>
              </div>
              <div className="flex justify-between font-black">
                <span>Totaal</span>
                <span>{euro(total)}</span>
              </div>
              <p
                className={`text-sm font-black ${closed ? "text-red-300" : "text-white/35"}`}
              >
                {expired
                  ? "Dit evenement is afgelopen."
                  : soldOut
                    ? "Alle tickets zijn uitverkocht."
                    : "Dit is een demonstratie-evenement; afrekenen is uitgeschakeld."}
              </p>
            </div>
          )}
          <p className="mt-5 flex items-start gap-3 text-xs leading-5 text-white/40">
            <ShieldCheck size={18} className="shrink-0 text-[#b8ff5a]" />
            Je aankoop valt onder ASORTA kopersbescherming.
          </p>
          {db && resaleListings?.length ? (
            <div className="mt-7 border-t border-white/10 pt-6">
              <h2 className="text-xl font-black">Veilige doorverkoop</h2>
              <p className="mt-2 text-xs text-white/40">
                Nieuwe QR-code na betaling. Prijsgrens gecontroleerd.
              </p>
              <div className="mt-4 grid gap-3">
                {resaleListings.map((l: any) => {
                  const type = l.tickets?.ticket_types,
                    total =
                      Number(l.asking_price) * (1 + Number(l.buyer_fee_rate));
                  return (
                    <form
                      key={l.id}
                      action="/api/checkout/resale"
                      method="post"
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <input type="hidden" name="listing_id" value={l.id} />
                      <input
                        type="hidden"
                        name="return_to"
                        value={`/events/${slug}`}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <strong>{type?.name}</strong>
                          <p className="mt-1 text-xs text-white/40">
                            Totaal incl. kosten {euro(total)}
                          </p>
                        </div>
                        <button className="btn-primary">
                          Koop {euro(Number(l.asking_price))}
                        </button>
                      </div>
                    </form>
                  );
                })}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
