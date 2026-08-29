import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Scanner from "./Scanner";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Tickets scannen",
  robots: { index: false, follow: false },
};
export default async function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect(`/login?next=/organizer/events/${id}/scan`);
  const { data: event } = await s
    .from("ticket_events")
    .select("id,title,city,starts_at,ticket_organizers!inner(owner_id,status)")
    .eq("id", id)
    .eq("ticket_organizers.owner_id", user.id)
    .eq("ticket_organizers.status", "verified")
    .maybeSingle();
  if (!event) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href={`/organizer/events/${id}`}
        className="text-sm font-bold text-white/50"
      >
        ← Terug naar evenement
      </Link>
      <p className="mt-8 text-xs font-black uppercase tracking-[.25em] text-[#b8ff5a]">
        Toegangscontrole
      </p>
      <h1 className="mt-3 text-4xl font-black sm:text-6xl">{event.title}</h1>
      <p className="mt-3 text-white/45">
        Elke QR-code kan slechts één keer worden ingecheckt.
      </p>
      <div className="mt-8">
        <Scanner eventId={id} />
      </div>
    </main>
  );
}
