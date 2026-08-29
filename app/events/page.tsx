import EventCard from "@/components/EventCard";
import { events } from "@/lib/tickets";
import { createClient } from "@/lib/supabase/server";
import { Search } from "lucide-react";
export const metadata = { title: "Evenementen" };
export const dynamic = "force-dynamic";
export default async function EventsPage() {
  const s = await createClient(),
    { data = [] } = await s
      .from("ticket_events")
      .select(
        "slug,title,venue,city,starts_at,category,ticket_types(face_value)",
      )
      .eq("status", "published")
      .order("starts_at", { ascending: true });
  const live = (data || []).map((e: any) => ({
    slug: e.slug,
    title: e.title,
    venue: e.venue,
    city: e.city,
    date: new Date(e.starts_at).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    category: e.category,
    price: e.ticket_types?.length
      ? Math.min(...e.ticket_types.map((t: any) => Number(t.face_value)))
      : 0,
    color: "#b8ff5a",
  }));
  const all = [
    ...live,
    ...events.filter((d) => !live.some((e: any) => e.slug === d.slug)),
  ];
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-14 sm:px-5">
      <p className="text-xs font-black uppercase tracking-[.25em] text-[#b8ff5a]">
        Heel Nederland
      </p>
      <h1 className="mt-3 text-4xl font-black sm:text-6xl">
        Vind jouw volgende evenement
      </h1>
      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3">
        <Search size={19} className="text-white/38" />
        <input
          className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
          placeholder="Zoek op artiest, evenement, locatie of plaats"
          aria-label="Evenementen zoeken"
        />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {["Alles", "Concert", "Festival", "Dance", "Sport", "Theater"].map(
          (x, i) => (
            <button
              key={x}
              className={`rounded-full px-4 py-2 text-sm font-black ${i === 0 ? "bg-[#b8ff5a] text-black" : "border border-white/10 text-white/58 hover:bg-white/8"}`}
            >
              {x}
            </button>
          ),
        )}
      </div>
      <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {all.map((event) => (
          <EventCard key={event.slug} event={event} />
        ))}
      </div>
    </main>
  );
}
