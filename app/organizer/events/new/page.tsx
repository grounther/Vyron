import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createEvent } from "../../actions";
export const metadata = { title: "Evenement aanmaken" };
export default async function NewEvent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const p = await searchParams,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login?next=/organizer/events/new");
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-black uppercase tracking-[.25em] text-[#b8ff5a]">
        Organisatorportaal
      </p>
      <h1 className="mt-3 text-4xl font-black sm:text-6xl">Nieuw evenement.</h1>
      {p.error && <Err>{p.error}</Err>}
      <form
        action={createEvent}
        className="card mt-8 grid gap-5 rounded-[2rem] p-6 sm:p-8"
      >
        <F label="Naam evenement" name="title" required />
        <div className="grid gap-5 sm:grid-cols-2">
          <F
            label="Categorie"
            name="category"
            placeholder="Concert, festival…"
            required
          />
          <F
            label="Startdatum en tijd"
            name="starts_at"
            type="datetime-local"
            required
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <F label="Locatie" name="venue" required />
          <F label="Plaats" name="city" required />
        </div>
        <label className="grid gap-2 text-sm font-bold text-white/70">
          Beschrijving
          <textarea name="description" rows={5} className="support-input" />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 p-4 font-bold">
            <input
              type="checkbox"
              name="resale_enabled"
              defaultChecked
              className="accent-[#b8ff5a]"
            />{" "}
            Doorverkoop toestaan
          </label>
          <F
            label="Maximale opslag doorverkoop (%)"
            name="resale_cap_percent"
            type="number"
            value="20"
          />
        </div>
        <button className="btn-primary justify-self-start">
          Concept aanmaken
        </button>
      </form>
    </main>
  );
}
function F(p: any) {
  return (
    <label className="grid gap-2 text-sm font-bold text-white/70">
      {p.label}
      <input
        className="support-input"
        name={p.name}
        required={p.required}
        type={p.type || "text"}
        placeholder={p.placeholder}
        defaultValue={p.value}
      />
    </label>
  );
}
function Err({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-red-100">
      {children}
    </div>
  );
}
