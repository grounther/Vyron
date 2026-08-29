"use client";
import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { deleteEvent } from "../../actions";

export default function DeleteEventButton({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-red-400/25 px-5 py-3 text-sm font-black text-red-300 transition hover:bg-red-500/10"
      >
        <Trash2 size={17} /> Evenement verwijderen
      </button>
    );
  return (
    <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-black text-red-100">
            “{eventTitle}” definitief verwijderen?
          </h3>
          <p className="mt-2 text-sm leading-6 text-red-100/65">
            Dit kan alleen wanneer er nog geen bestellingen of tickets bestaan.
            Deze actie kan niet ongedaan worden gemaakt.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-red-100/50"
        >
          <X />
        </button>
      </div>
      <form action={deleteEvent} className="mt-4">
        <input type="hidden" name="event_id" value={eventId} />
        <button className="rounded-full bg-red-500 px-5 py-3 text-sm font-black text-white">
          Ja, definitief verwijderen
        </button>
      </form>
    </div>
  );
}
