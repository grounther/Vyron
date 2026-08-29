import Link from "next/link";
import { assertAtlasPermission } from "@/lib/atlas-auth";
import { reviewOrganizer } from "./actions";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Organisatoren | Atlas",
  robots: { index: false, follow: false },
};
export default async function Organizers({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const p = await searchParams,
    { admin } = await assertAtlasPermission("settings", "/atlas/organizers");
  const { data, error } = await admin
      .from("ticket_organizers")
      .select("*")
      .order("created_at", { ascending: false }),
    rows = data || [];
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.25em] text-[#b8ff5a]">
            Atlas beheer
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-6xl">
            Organisatoren
          </h1>
          <p className="mt-3 text-white/50">
            Controleer KvK- en contactgegevens voordat een organisator kan
            publiceren.
          </p>
        </div>
        <Link className="btn-secondary" href="/atlas">
          Terug
        </Link>
      </div>
      {(p.error || error) && (
        <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-red-100">
          {p.error || error?.message}
        </div>
      )}
      {p.saved && (
        <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-emerald-100">
          Beoordeling opgeslagen.
        </div>
      )}
      <div className="mt-8 grid gap-5">
        {rows.map((o: any) => (
          <section key={o.id} className="card rounded-[2rem] p-6">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">{o.name}</h2>
                <p className="mt-2 text-sm text-white/50">
                  KvK {o.kvk_number || "—"} · {o.phone || "geen telefoon"}
                </p>
                {o.website && (
                  <a
                    href={o.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-sm text-[#b8ff5a]"
                  >
                    {o.website}
                  </a>
                )}
              </div>
              <span className="h-fit rounded-full border border-white/10 px-3 py-1 text-xs font-black uppercase">
                {o.status}
              </span>
            </div>
            {o.description && (
              <p className="mt-5 max-w-3xl text-sm leading-6 text-white/55">
                {o.description}
              </p>
            )}
            <form
              action={reviewOrganizer}
              className="mt-6 flex flex-wrap items-end gap-3"
            >
              <input type="hidden" name="id" value={o.id} />
              <label className="grid min-w-56 flex-1 gap-2 text-xs font-bold text-white/55">
                Interne reden / opmerking
                <input
                  className="support-input"
                  name="reason"
                  defaultValue={o.rejection_reason || ""}
                />
              </label>
              <button name="status" value="verified" className="btn-primary">
                Goedkeuren
              </button>
              <button name="status" value="suspended" className="btn-secondary">
                Blokkeren
              </button>
              <button name="status" value="pending" className="btn-secondary">
                Terug naar beoordeling
              </button>
            </form>
          </section>
        ))}
        {!rows.length && (
          <div className="card rounded-2xl p-8 text-white/50">
            Nog geen aanmeldingen.
          </div>
        )}
      </div>
    </main>
  );
}
