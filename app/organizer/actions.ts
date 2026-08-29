"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const clean = (v: FormDataEntryValue | null, n = 500) =>
  typeof v === "string" ? v.trim().slice(0, n) : "";
const go = (path: string, params: Record<string, string>) =>
  redirect(`${path}?${new URLSearchParams(params)}`);

async function session(next: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { supabase, user };
}

export async function applyOrganizer(formData: FormData) {
  const { supabase, user } = await session("/organizer/apply");
  const name = clean(formData.get("name"), 160);
  const kvk = clean(formData.get("kvk_number"), 16).replace(/\D/g, "");
  try {
    if (name.length < 2)
      throw new Error("Vul je bedrijfs- of organisatienaam in.");
    if (kvk.length !== 8)
      throw new Error("Een KvK-nummer bestaat uit 8 cijfers.");
    const { error } = await supabase
      .from("ticket_organizers")
      .upsert(
        {
          owner_id: user.id,
          name,
          kvk_number: kvk,
          website: clean(formData.get("website"), 240) || null,
          phone: clean(formData.get("phone"), 40) || null,
          description: clean(formData.get("description"), 1200) || null,
          status: "pending",
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "owner_id" },
      );
    if (error) throw error;
    revalidatePath("/organizer");
  } catch (e) {
    go("/organizer/apply", {
      error: e instanceof Error ? e.message : "Aanmelding mislukt.",
    });
  }
  redirect("/organizer?applied=1");
}

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
}

export async function createEvent(formData: FormData) {
  const { supabase, user } = await session("/organizer/events/new");
  const { data: org } = await supabase
    .from("ticket_organizers")
    .select("id,status")
    .eq("owner_id", user.id)
    .maybeSingle();
  let createdEventId = "";
  try {
    if (!org || org.status !== "verified")
      throw new Error("Je organisatoraccount moet eerst zijn goedgekeurd.");
    const title = clean(formData.get("title"), 180);
    const starts = clean(formData.get("starts_at"), 60);
    if (title.length < 3 || !starts)
      throw new Error("Vul een titel en startmoment in.");
    const slug = `${slugify(title)}-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from("ticket_events")
      .insert({
        organizer_id: org.id,
        slug,
        title,
        category: clean(formData.get("category"), 80),
        venue: clean(formData.get("venue"), 160),
        city: clean(formData.get("city"), 100),
        starts_at: new Date(starts).toISOString(),
        description: clean(formData.get("description"), 3000) || null,
        resale_enabled: formData.get("resale_enabled") === "on",
        resale_cap_percent: Number(
          clean(formData.get("resale_cap_percent"), 10) || 20,
        ),
        status: "draft",
      })
      .select("id")
      .single();
    if (error) throw error;
    createdEventId = data.id;
  } catch (e) {
    go("/organizer/events/new", {
      error: e instanceof Error ? e.message : "Evenement aanmaken mislukt.",
    });
  }
  redirect(`/organizer/events/${createdEventId}?created=1`);
}

async function ownedEvent(supabase: any, userId: string, eventId: string) {
  const { data } = await supabase
    .from("ticket_events")
    .select("id,organizer_id,ticket_organizers!inner(owner_id,status)")
    .eq("id", eventId)
    .eq("ticket_organizers.owner_id", userId)
    .maybeSingle();
  return data;
}

export async function addTicketType(formData: FormData) {
  const eventId = clean(formData.get("event_id"), 80);
  const { supabase, user } = await session(`/organizer/events/${eventId}`);
  try {
    if (!(await ownedEvent(supabase, user.id, eventId)))
      throw new Error("Evenement niet gevonden.");
    const name = clean(formData.get("name"), 120),
      price = Number(clean(formData.get("face_value"), 20).replace(",", ".")),
      capacity = Number(clean(formData.get("capacity"), 12));
    if (
      !name ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(capacity) ||
      capacity < 1
    )
      throw new Error("Controleer naam, prijs en capaciteit.");
    const { error } = await supabase
      .from("ticket_types")
      .insert({ event_id: eventId, name, face_value: price, capacity });
    if (error) throw error;
    revalidatePath(`/organizer/events/${eventId}`);
  } catch (e) {
    go(`/organizer/events/${eventId}`, {
      error: e instanceof Error ? e.message : "Ticketsoort toevoegen mislukt.",
    });
  }
  go(`/organizer/events/${eventId}`, { saved: "ticket" });
}

export async function setEventStatus(formData: FormData) {
  const eventId = clean(formData.get("event_id"), 80),
    status = clean(formData.get("status"), 20);
  const { supabase, user } = await session(`/organizer/events/${eventId}`);
  try {
    if (!["draft", "published", "cancelled"].includes(status))
      throw new Error("Ongeldige status.");
    if (!(await ownedEvent(supabase, user.id, eventId)))
      throw new Error("Evenement niet gevonden.");
    if (status === "published") {
      const { count } = await supabase
        .from("ticket_types")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);
      if (!count) throw new Error("Voeg eerst minimaal één ticketsoort toe.");
    }
    const { error } = await supabase
      .from("ticket_events")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", eventId);
    if (error) throw error;
    revalidatePath("/organizer");
    revalidatePath(`/organizer/events/${eventId}`);
  } catch (e) {
    go(`/organizer/events/${eventId}`, {
      error: e instanceof Error ? e.message : "Status wijzigen mislukt.",
    });
  }
  go(`/organizer/events/${eventId}`, { saved: "status" });
}
