import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Semi-annual data-freshness pass: flags catalogue rows whose verification
 * timestamps are older than 12 months, dropping their confidence so the
 * matching engine and UI stop presenting stale facts as fresh.
 *
 *   curl -X POST $URL/api/cron/data-freshness -H "x-cron-secret: $CRON_SECRET"
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const cutoff = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();

    // Null out the verification stamps — the UI treats null as
    // "unverified" (low confidence) rather than inventing a fake date.
    const results = await Promise.all([
      supabase
        .from("programmes")
        .update({ tuition_updated_at: null })
        .lt("tuition_updated_at", cutoff)
        .select("id"),
      supabase
        .from("programmes")
        .update({ requirements_updated_at: null })
        .lt("requirements_updated_at", cutoff)
        .select("id"),
    ]);

    const [tuition, requirements] = results;
    const errors = [tuition.error, requirements.error].filter(Boolean);
    if (errors.length > 0) throw errors[0];

    return NextResponse.json({
      ok: true,
      tuitionFlagged: tuition.data?.length ?? 0,
      requirementsFlagged: requirements.data?.length ?? 0,
    });
  } catch (err) {
    console.error("Data freshness pass failed:", err);
    return NextResponse.json({ error: "freshness_failed" }, { status: 500 });
  }
}