import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { euro, type EventItem } from "@/lib/tickets";
import { eventCover } from "@/lib/event-images";
export default function EventCard({ event }: { event: EventItem }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group overflow-hidden rounded-[1.45rem] border border-white/10 bg-white/[.035] transition duration-300 hover:-translate-y-1 hover:border-white/22"
    >
      <div
        className="relative h-44 overflow-hidden bg-cover bg-center p-5"
        style={{
          backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.7)),url(${eventCover(event.category)})`,
        }}
      >
        <span
          className={`rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] backdrop-blur ${event.closed ? "border-red-400/30 bg-red-500/20 text-red-100" : "border-white/15 bg-black/30"}`}
        >
          {event.closed ? event.closedLabel || "Gesloten" : event.category}
        </span>
        <div className="absolute -bottom-8 -right-4 h-36 w-36 rotate-12 rounded-[2.2rem] border border-white/15 bg-white/[.06] shadow-2xl transition duration-500 group-hover:-translate-y-2 group-hover:-rotate-3" />
      </div>
      <div className="p-5">
        <p className="flex items-center gap-2 text-xs font-bold text-white/46">
          <CalendarDays size={14} />
          {event.date}
        </p>
        <h3 className="mt-3 text-xl font-black leading-tight">{event.title}</h3>
        <p className="mt-2 flex items-center gap-2 text-sm text-white/48">
          <MapPin size={14} />
          {event.venue}, {event.city}
        </p>
        <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
          <span className="text-xs text-white/38">
            {event.closed ? "Verkoop gesloten" : "Vanaf"}
          </span>
          <strong className="text-lg">
            {event.closed ? "—" : euro(event.price)}
          </strong>
        </div>
      </div>
    </Link>
  );
}
