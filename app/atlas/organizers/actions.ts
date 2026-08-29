"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAtlasPermission } from "@/lib/atlas-auth";
const clean = (v: FormDataEntryValue | null, n = 500) =>
  typeof v === "string" ? v.trim().slice(0, n) : "";
export async function reviewOrganizer(formData: FormData) {
  const { admin } = await assertAtlasPermission(
    "settings",
    "/atlas/organizers",
  );
  const id = clean(formData.get("id"), 80),
    status = clean(formData.get("status"), 20),
    reason = clean(formData.get("reason"), 500);
  try {
    if (!id || !["verified", "pending", "suspended"].includes(status))
      throw new Error("Ongeldige beoordeling.");
    const { error } = await admin
      .from("ticket_organizers")
      .update({
        status,
        rejection_reason: status === "verified" ? null : reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/atlas/organizers");
  } catch (e) {
    redirect(
      `/atlas/organizers?error=${encodeURIComponent(e instanceof Error ? e.message : "Opslaan mislukt.")}`,
    );
  }
  redirect("/atlas/organizers?saved=1");
}
