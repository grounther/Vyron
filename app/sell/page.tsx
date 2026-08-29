import { redirect } from "next/navigation";
import { BadgeCheck, ShieldCheck, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { euro } from "@/lib/tickets";
import { createListing, withdrawListing } from "./actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Ticket verkopen" };
const one = (value: any) => (Array.isArray(value) ? value[0] : value);
export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; withdrawn?: string }>;
}) {
  const p = await searchParams,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login?next=/sell");
  const { data: tickets = [] } = await s
    .from("tickets")
    .select(
      "id,status,ticket_types(id,name,face_value,ticket_events(id,title,starts_at,resale_enabled,resale_cap_percent))",
    )
    .eq("owner_id", user.id)
    .in("status", ["valid", "listed"])
    .order("issued_at", { ascending: false });
  const { data: listings = [] } = await s
    .from("ticket_listings")
    .select("id,ticket_id,asking_price,status,created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });
  const activeTicketIds = new Set(
    (listings || [])
      .filter((l: any) => ["active", "reserved"].includes(l.status))
      .map((l: any) => l.ticket_id),
  );
  const eligible = (tickets || []).filter((t: any) => {
    const type = one(t.ticket_types),
      e = one(type?.ticket_events);
    return (
      t.status === "valid" &&
      e?.resale_enabled &&
      new Date(e.starts_at).getTime() > Date.now() &&
      !activeTicketIds.has(t.id)
    );
  });
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-14">
      <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[.25em] text-[#b8ff5a]">
            Veilige doorverkoop
          </p>
          <h1 className="mt-4 text-4xl font-black sm:text-6xl">
            Verkoop je ticket veilig.
          </h1>
          <p className="mt-6 text-lg leading-8 text-white/52">
            Je betaalt 4,5% bij een succesvolle verkoop. De koper ontvangt
            automatisch een nieuwe QR-code.
          </p>
          <div className="mt-9 grid gap-4 text-sm text-white/60">
            <span className="flex items-center gap-3">
              <BadgeCheck className="text-[#b8ff5a]" />
              Alleen echte ASORTA-tickets kunnen worden aangeboden
            </span>
            <span className="flex items-center gap-3">
              <ShieldCheck className="text-[#b8ff5a]" />
              De maximale prijs wordt automatisch afgedwongen
            </span>
          </div>
        </div>
        <div>
          {p.error && <Notice error>{p.error}</Notice>}
          {p.saved && <Notice>Advertentie staat live.</Notice>}
          {p.withdrawn && <Notice>Advertentie is ingetrokken.</Notice>}
          <form
            action={createListing}
            className="card rounded-[2rem] p-6 sm:p-8"
          >
            <h2 className="text-2xl font-black">Nieuw aanbod</h2>
            {eligible.length ? (
              <>
                <label className="mt-6 grid gap-2 text-sm font-bold text-white/65">
                  Jouw ticket
                  <select name="ticket_id" required className="support-input">
                    {eligible.map((t: any) => {
                      const type = one(t.ticket_types),
                        e = one(type?.ticket_events),
                        max =
                          Number(type.face_value) *
                          (1 + Number(e.resale_cap_percent) / 100);
                      return (
                        <option key={t.id} value={t.id}>
                          {e.title} — {type.name} (max. {euro(max)})
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label className="mt-5 grid gap-2 text-sm font-bold text-white/65">
                  Vraagprijs
                  <input
                    name="asking_price"
                    required
                    inputMode="decimal"
                    className="support-input"
                    placeholder="Bijvoorbeeld 35,00"
                  />
                </label>
                <button className="btn-primary mt-6 inline-flex gap-2">
                  <Tag size={17} /> Ticket aanbieden
                </button>
              </>
            ) : (
              <p className="mt-5 rounded-2xl border border-white/10 p-5 text-sm text-white/45">
                Je hebt momenteel geen geldig ticket dat voor doorverkoop
                beschikbaar is.
              </p>
            )}
          </form>
        </div>
      </div>
      <section className="mt-12">
        <h2 className="text-2xl font-black">Mijn advertenties</h2>
        <div className="mt-5 grid gap-4">
          {(listings || []).map((l: any) => {
            const ticket = (tickets || []).find(
                (t: any) => t.id === l.ticket_id,
              ),
              type: any = one(ticket?.ticket_types),
              e: any = one(type?.ticket_events);
            return (
              <article
                key={l.id}
                className="card flex flex-col justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <strong>{e?.title || "Ticket"}</strong>
                  <p className="mt-1 text-sm text-white/45">
                    {type?.name} · {euro(Number(l.asking_price))}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black uppercase">
                    {l.status}
                  </span>
                  {l.status === "active" && (
                    <form action={withdrawListing}>
                      <input type="hidden" name="listing_id" value={l.id} />
                      <button className="btn-secondary">Intrekken</button>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
          {!listings?.length && (
            <div className="card rounded-2xl p-7 text-white/45">
              Nog geen advertenties.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`mb-5 rounded-2xl border p-4 text-sm ${error ? "border-red-400/25 bg-red-500/10 text-red-100" : "border-[#b8ff5a]/25 bg-[#b8ff5a]/10 text-[#dfffba]"}`}
    >
      {children}
    </div>
  );
}
