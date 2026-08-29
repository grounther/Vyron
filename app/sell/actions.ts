"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
const clean = (v: FormDataEntryValue | null, n = 100) =>
  typeof v === "string" ? v.trim().slice(0, n) : "";
export async function createListing(formData: FormData) {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login?next=/sell");
  try {
    const ticketId = clean(formData.get("ticket_id"), 80),
      price = Number(clean(formData.get("asking_price"), 20).replace(",", "."));
    if (!ticketId || !Number.isFinite(price))
      throw new Error("Selecteer een ticket en vul een geldige prijs in.");
    const { error } = await s.rpc("create_ticket_listing", {
      p_ticket_id: ticketId,
      p_asking_price: price,
    });
    if (error) throw error;
    revalidatePath("/sell");
    revalidatePath("/account");
  } catch (e) {
    redirect(
      `/sell?error=${encodeURIComponent(e instanceof Error ? e.message : "Aanbieden mislukt.")}`,
    );
  }
  redirect("/sell?saved=1");
}
export async function withdrawListing(formData: FormData) {
  const s = await createClient(),
    {
      data: { user },
    } = await s.auth.getUser();
  if (!user) redirect("/login?next=/sell");
  try {
    const id = clean(formData.get("listing_id"), 80);
    const { error } = await s.rpc("withdraw_ticket_listing", {
      p_listing_id: id,
    });
    if (error) throw error;
    revalidatePath("/sell");
    revalidatePath("/account");
  } catch (e) {
    redirect(
      `/sell?error=${encodeURIComponent(e instanceof Error ? e.message : "Intrekken mislukt.")}`,
    );
  }
  redirect("/sell?withdrawn=1");
}
