import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { CalendarDays, TicketCheck, WalletCards, Heart } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function AccountPage() {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login?next=/account");
  const { data: rows = [] } = await s
    .from("tickets")
    .select(
      "id,qr_code,status,ticket_types(name,face_value,ticket_events(title,starts_at,venue,city))",
    )
    .eq("owner_id", user.id)
    .order("issued_at", { ascending: false });
  const tickets = await Promise.all(
    (rows || []).map(async (t: any) => ({
      ...t,
      qr: await QRCode.toDataURL(
        `${process.env.NEXT_PUBLIC_SITE_URL || "https://asorta.nl"}/validate/${t.qr_code}`,
        { width: 260, margin: 2, color: { dark: "#050505", light: "#ffffff" } },
      ),
    })),
  );
  const cards = [
    { Icon: TicketCheck, label: "Mijn tickets", value: String(tickets.length) },
    { Icon: WalletCards, label: "Aangeboden", value: "0" },
    { Icon: CalendarDays, label: "Evenementen", value: "0" },
    { Icon: Heart, label: "Favorieten", value: "0" },
  ];
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-14 sm:px-5">
      <p className="text-xs font-black uppercase tracking-[.25em] text-[#b8ff5a]">
        Mijn ASORTA
      </p>
      <h1 className="mt-3 text-4xl font-black sm:text-6xl">Welkom terug.</h1>
      <p className="mt-3 text-white/45">{user.email}</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ Icon, label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-white/[.035] p-5"
          >
            <Icon className="text-[#b8ff5a]" />
            <strong className="mt-7 block text-3xl">{value}</strong>
            <span className="text-sm text-white/42">{label}</span>
          </div>
        ))}
      </div>
      {tickets.length ? (
        <section className="mt-10">
          <h2 className="text-2xl font-black">Mijn tickets</h2>
          <p className="mt-2 text-sm text-white/45">
            Laat de QR-code bij de ingang scannen. Deel hem nooit met anderen.
          </p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {tickets.map((t: any) => {
              const type = t.ticket_types,
                event = type?.ticket_events;
              return (
                <article
                  key={t.id}
                  className="card grid gap-5 rounded-[2rem] p-6 sm:grid-cols-[1fr_150px] sm:items-center"
                >
                  <div>
                    <span className="text-xs font-black uppercase tracking-[.2em] text-[#b8ff5a]">
                      {t.status}
                    </span>
                    <h3 className="mt-3 text-2xl font-black">{event?.title}</h3>
                    <p className="mt-2 text-sm text-white/50">{type?.name}</p>
                    <p className="mt-4 text-sm text-white/45">
                      {event?.starts_at &&
                        new Date(event.starts_at).toLocaleString("nl-NL")}
                      <br />
                      {event?.venue}, {event?.city}
                    </p>
                  </div>
                  <Image
                    src={t.qr}
                    alt="Unieke ticket QR-code"
                    width={150}
                    height={150}
                    unoptimized
                    className="rounded-xl"
                  />
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[.035] p-7">
          <h2 className="text-2xl font-black">Nog geen tickets</h2>
          <p className="mt-3 text-white/48">
            Na een geslaagde betaling verschijnen je unieke QR-tickets hier.
          </p>
        </div>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/events" className="btn-primary">
          Zoek evenementen
        </Link>
        <Link href="/sell" className="btn-secondary">
          Ticket verkopen
        </Link>
        <Link href="/organizer" className="btn-secondary">
          Organisatorportaal
        </Link>
        <form action="/auth/signout" method="post">
          <button className="btn-secondary text-white/55">Uitloggen</button>
        </form>
      </div>
    </main>
  );
}
