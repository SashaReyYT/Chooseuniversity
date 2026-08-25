"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const FOLDERS = new Set(["none", "dream", "target", "safety"]);

/** Saves the user's private comment on a saved programme (≤500 chars). */
export async function updateSavedNote(formData: FormData): Promise<void> {
  const programmeId = String(formData.get("programmeId") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  if (!programmeId) return;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("saved_programmes")
    .update({ note: note || null })
    .eq("user_id", user.id)
    .eq("programme_id", programmeId);

  revalidatePath("/saved");
}

/** Moves a saved programme between triage folders. */
export async function updateSavedFolder(formData: FormData): Promise<void> {
  const programmeId = String(formData.get("programmeId") ?? "");
  const folder = String(formData.get("folder") ?? "none");

  if (!programmeId || !FOLDERS.has(folder)) return;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("saved_programmes")
    .update({ folder })
    .eq("user_id", user.id)
    .eq("programme_id", programmeId);

  revalidatePath("/saved");
}