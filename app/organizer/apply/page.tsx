import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyOrganizer } from "../actions";
export const metadata = { title: "Aanmelden als organisator" };
export default async function Apply({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const p = await searchParams,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login?next=/organizer/apply");
  const { data: o } = await s
    .from("ticket_organizers")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-black uppercase tracking-[.25em] text-[#b8ff5a]">
        Zakelijk aanmelden
      </p>
      <h1 className="mt-3 text-4xl font-black sm:text-6xl">
        Vertel ons wie je bent.
      </h1>
      <p className="mt-4 text-white/50">
        We controleren iedere organisator voordat tickets live kunnen.
      </p>
      {p.error && (
        <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-red-100">
          {p.error}
        </div>
      )}
      <form
        action={applyOrganizer}
        className="card mt-8 grid gap-5 rounded-[2rem] p-6 sm:p-8"
      >
        <Field
          label="Organisatie- of bedrijfsnaam"
          name="name"
          value={o?.name}
          required
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="KvK-nummer"
            name="kvk_number"
            value={o?.kvk_number}
            placeholder="12345678"
            required
          />
          <Field label="Telefoonnummer" name="phone" value={o?.phone} />
        </div>
        <Field
          label="Website"
          name="website"
          value={o?.website}
          placeholder="https://"
        />
        <label className="grid gap-2 text-sm font-bold text-white/70">
          Over je organisatie
          <textarea
            name="description"
            defaultValue={o?.description || ""}
            rows={5}
            className="support-input"
            placeholder="Welke evenementen organiseer je?"
          />
        </label>
        <button className="btn-primary justify-self-start" type="submit">
          Aanmelding versturen
        </button>
      </form>
    </main>
  );
}
function Field({
  label,
  name,
  value,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  value?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-white/70">
      {label}
      <input
        className="support-input"
        name={name}
        defaultValue={value || ""}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}
