import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addTicketType, setEventStatus } from "../../actions";
import DeleteEventButton from "./DeleteEventButton";
export const dynamic = "force-dynamic";
export default async function Manage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params,
    p = await searchParams,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect(`/login?next=/organizer/events/${id}`);
  const { data: e } = await s
    .from("ticket_events")
    .select("*,ticket_organizers!inner(owner_id,name),ticket_types(*)")
    .eq("id", id)
    .eq("ticket_organizers.owner_id", user.id)
    .maybeSingle();
  if (!e) notFound();
  const types = e.ticket_types || [],
    capacity = types.reduce((n: number, t: any) => n + Number(t.capacity), 0);
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <Link href="/organizer" className="text-sm font-bold text-white/50">
        ← Terug naar dashboard
      </Link>
      <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[.25em] text-[#b8ff5a]">
            {e.status}
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-6xl">{e.title}</h1>
          <p className="mt-3 text-white/50">
            {new Date(e.starts_at).toLocaleString("nl-NL")} · {e.venue},{" "}
            {e.city}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/organizer/events/${id}/scan`} className="btn-primary">
            Tickets scannen
          </Link>
          <form action={setEventStatus}>
            <input type="hidden" name="event_id" value={id} />
            <input
              type="hidden"
              name="status"
              value={e.status === "published" ? "draft" : "published"}
            />
            <button
              className={
                e.status === "published" ? "btn-secondary" : "btn-primary"
              }
            >
              {e.status === "published"
                ? "Terug naar concept"
                : "Evenement publiceren"}
            </button>
          </form>
        </div>
      </div>
      {p.error && (
        <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-red-100">
          {p.error}
        </div>
      )}
      {p.saved && (
        <div className="mt-6 rounded-2xl border border-[#b8ff5a]/25 bg-[#b8ff5a]/10 p-4 text-[#dfffba]">
          Wijziging opgeslagen.
        </div>
      )}
      <div className="mt-9 grid gap-5 sm:grid-cols-3">
        <Stat label="Ticketsoorten" value={types.length} />
        <Stat label="Totale capaciteit" value={capacity} />
        <Stat label="Doorverkooplimiet" value={`${e.resale_cap_percent}%`} />
      </div>
      <section className="mt-10">
        <h2 className="text-2xl font-black">Ticketsoorten</h2>
        <div className="mt-5 grid gap-3">
          {types.map((t: any) => (
            <div
              key={t.id}
              className="card flex items-center justify-between rounded-2xl p-5"
            >
              <div>
                <strong>{t.name}</strong>
                <p className="text-sm text-white/45">Capaciteit {t.capacity}</p>
              </div>
              <strong className="text-xl">
                € {Number(t.face_value).toFixed(2).replace(".", ",")}
              </strong>
            </div>
          ))}
        </div>
        <form
          action={addTicketType}
          className="card mt-6 grid gap-4 rounded-[2rem] p-6 sm:grid-cols-4 sm:items-end"
        >
          <input type="hidden" name="event_id" value={id} />
          <Field label="Naam" name="name" />
          <Field
            label="Prijs (€)"
            name="face_value"
            type="number"
            step="0.01"
          />
          <Field label="Capaciteit" name="capacity" type="number" />
          <button className="btn-primary">Toevoegen</button>
        </form>
      </section>
      <section className="mt-10 border-t border-white/10 pt-8">
        <h2 className="text-xl font-black">Gevarenzone</h2>
        <p className="mt-2 mb-5 text-sm text-white/45">
          Evenementen met bestellingen of tickets worden beschermd tegen
          verwijderen.
        </p>
        <DeleteEventButton eventId={id} eventTitle={e.title} />
      </section>
    </main>
  );
}
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card rounded-2xl p-5">
      <p className="text-xs font-black uppercase tracking-[.18em] text-white/40">
        {label}
      </p>
      <strong className="mt-3 block text-3xl">{value}</strong>
    </div>
  );
}
function Field(p: any) {
  return (
    <label className="grid gap-2 text-sm font-bold text-white/70">
      {p.label}
      <input
        className="support-input"
        name={p.name}
        type={p.type || "text"}
        step={p.step}
        required
        min={p.type === "number" ? 0 : undefined}
      />
    </label>
  );
}
