import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { syncEcbRates } from "@/lib/services/currency-sync.service";

/**
 * Weekly ECB rate refresh, invoked by the currency-sync GitHub Action
 * (schedule in .github/workflows/currency-sync.yml). Guarded by a shared
 * secret so the endpoint is useless to outsiders.
 *
 *   curl -X POST $URL/api/cron/currency -H "x-cron-secret: $CRON_SECRET"
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const updated = await syncEcbRates(supabase);
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    console.error("Currency sync failed:", err);
    return NextResponse.json({ error: "sync_failed" }, { status: 500 });
  }
}