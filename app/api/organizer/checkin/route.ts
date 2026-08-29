import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function codeFromInput(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.pathname.split("/").filter(Boolean).pop() || "";
  } catch {
    return raw.split("/").filter(Boolean).pop() || "";
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "Log opnieuw in." },
      { status: 401 },
    );

  const body = await req.json().catch(() => ({}));
  const eventId = String(body.eventId || "");
  const qrCode = codeFromInput(body.code);
  if (!eventId || !qrCode)
    return NextResponse.json(
      {
        ok: false,
        code: "invalid_input",
        message: "Geen geldige QR-code ontvangen.",
      },
      { status: 400 },
    );

  const admin = createAdminClient();
  if (!admin)
    return NextResponse.json(
      {
        ok: false,
        code: "configuration",
        message: "Scanner is niet geconfigureerd.",
      },
      { status: 500 },
    );

  const { data: organizer } = await admin
    .from("ticket_organizers")
    .select("id,status")
    .eq("owner_id", user.id)
    .eq("status", "verified")
    .maybeSingle();
  if (!organizer)
    return NextResponse.json(
      {
        ok: false,
        code: "forbidden",
        message: "Geen goedgekeurd organisatoraccount.",
      },
      { status: 403 },
    );

  const { data: event } = await admin
    .from("ticket_events")
    .select("id,title")
    .eq("id", eventId)
    .eq("organizer_id", organizer.id)
    .maybeSingle();
  if (!event)
    return NextResponse.json(
      {
        ok: false,
        code: "forbidden",
        message: "Dit evenement hoort niet bij jouw organisatie.",
      },
      { status: 403 },
    );

  const { data: ticket } = await admin
    .from("tickets")
    .select("id,status,scanned_at,ticket_types!inner(name,event_id)")
    .eq("qr_code", qrCode)
    .maybeSingle();
  if (!ticket)
    return NextResponse.json(
      {
        ok: false,
        code: "unknown",
        message: "Onbekende QR-code. Geen ASORTA-ticket gevonden.",
      },
      { status: 404 },
    );
  const type: any = ticket.ticket_types;
  if (type?.event_id !== eventId)
    return NextResponse.json(
      {
        ok: false,
        code: "wrong_event",
        message: "Dit ticket hoort bij een ander evenement.",
      },
      { status: 409 },
    );
  if (ticket.status === "scanned")
    return NextResponse.json(
      {
        ok: false,
        code: "already_scanned",
        message: `Ticket is al gebruikt${ticket.scanned_at ? ` om ${new Date(ticket.scanned_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}` : ""}.`,
        ticketType: type?.name,
      },
      { status: 409 },
    );
  if (ticket.status !== "valid")
    return NextResponse.json(
      {
        ok: false,
        code: "invalid_status",
        message: `Ticket is niet geldig (${ticket.status}).`,
        ticketType: type?.name,
      },
      { status: 409 },
    );

  const scannedAt = new Date().toISOString();
  const { data: checkedIn, error } = await admin
    .from("tickets")
    .update({ status: "scanned", scanned_at: scannedAt })
    .eq("id", ticket.id)
    .eq("status", "valid")
    .select("id")
    .maybeSingle();
  if (error)
    return NextResponse.json(
      {
        ok: false,
        code: "error",
        message: "Inchecken mislukt. Probeer opnieuw.",
      },
      { status: 500 },
    );
  if (!checkedIn)
    return NextResponse.json(
      {
        ok: false,
        code: "already_scanned",
        message: "Ticket is zojuist al door een andere scanner gebruikt.",
      },
      { status: 409 },
    );

  return NextResponse.json({
    ok: true,
    code: "checked_in",
    message: "Toegang goedgekeurd",
    ticketType: type?.name,
    eventTitle: event.title,
    scannedAt,
  });
}
