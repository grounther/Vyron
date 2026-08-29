import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, CalendarDays, Plus, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export const metadata = { title: "Organisatorportaal" };
export default async function Organizer({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login?next=/organizer");
  const { data: org } = await s
    .from("ticket_organizers")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!org)
    return (
      <main className="mx-auto min-h-[70vh] max-w-4xl px-4 py-16">
        <Building2 className="text-[#b8ff5a]" size={38} />
        <h1 className="mt-5 text-4xl font-black sm:text-6xl">
          Word organisator.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-white/55">
          Meld je organisatie aan. Na onze controle kun je evenementen en
          ticketsoorten publiceren.
        </p>
        <Link href="/organizer/apply" className="btn-primary mt-8 inline-flex">
          Aanmelding starten
        </Link>
      </main>
    );
  const { data } = await s
    .from("ticket_events")
    .select("id,title,city,starts_at,status,ticket_types(capacity)")
    .eq("organizer_id", org.id)
    .order("starts_at", { ascending: true });
  const events = data || []
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[.25em] text-[#b8ff5a]">
            Organisatorportaal
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-6xl">{org.name}</h1>
          <p className="mt-3 text-white/50">
            Status:{" "}
            <strong
              className={
                org.status === "verified" ? "text-[#b8ff5a]" : "text-amber-300"
              }
            >
              {org.status === "verified" ? "Goedgekeurd" : "In beoordeling"}
            </strong>
          </p>
        </div>
        {org.status === "verified" && (
          <Link
            href="/organizer/events/new"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={18} /> Evenement maken
          </Link>
        )}
      </div>
      {p.applied && (
        <Notice>
          Je aanmelding is ontvangen. We controleren je gegevens zo snel
          mogelijk.
        </Notice>
      )}
      {org.status !== "verified" ? (
        <section className="card mt-8 rounded-[2rem] p-7">
          <ShieldCheck className="text-amber-300" />
          <h2 className="mt-5 text-2xl font-black">Controle loopt</h2>
          <p className="mt-2 text-white/50">
            Na goedkeuring verschijnt hier de knop om je eerste evenement aan te
            maken.
          </p>
        </section>
      ) : (
        <section className="mt-10">
          <h2 className="text-2xl font-black">Jouw evenementen</h2>
          <div className="mt-5 grid gap-4">
            {events.length ? (
              events.map((e: any) => (
                <Link
                  key={e.id}
                  href={`/organizer/events/${e.id}`}
                  className="card flex flex-col justify-between gap-4 rounded-2xl p-5 transition hover:border-[#b8ff5a]/35 sm:flex-row sm:items-center"
                >
                  <div>
                    <strong className="text-xl">{e.title}</strong>
                    <p className="mt-1 text-sm text-white/45">
                      {new Date(e.starts_at).toLocaleString("nl-NL")} · {e.city}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black uppercase text-white/60">
                    {e.status}
                  </span>
                </Link>
              ))
            ) : (
              <div className="card rounded-2xl p-7 text-white/50">
                <CalendarDays className="mb-4 text-[#b8ff5a]" />
                Nog geen evenementen.
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-[#b8ff5a]/25 bg-[#b8ff5a]/10 p-4 text-sm text-[#dfffba]">
      {children}
    </div>
  );
}
