"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface DataIssueState {
  error: string | null;
  sent?: boolean;
}

const FIELDS = new Set([
  "tuition",
  "requirements",
  "deadline",
  "documents",
  "other",
]);

/**
 * Stores a crowdsourced correction report. Never throws to the client —
 * a failed report shouldn't break the page the user is reading.
 */
export async function submitDataIssue(
  _prevState: DataIssueState,
  formData: FormData,
): Promise<DataIssueState> {
  const programmeId = String(formData.get("programmeId") ?? "");
  const field = String(formData.get("field") ?? "other");
  const message = String(formData.get("message") ?? "").trim();

  if (!programmeId || !FIELDS.has(field) || message.length < 4) {
    return { error: "invalid" };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("data_issue_reports").insert({
      programme_id: programmeId,
      reported_by: user?.id ?? null,
      field,
      message: message.slice(0, 1000),
    });

    if (error) return { error: "db" };
    return { error: null, sent: true };
  } catch {
    return { error: "network" };
  }
}