import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Type-ahead search for the ⌘K palette: universities + programmes by name
 * (trigram index makes ILIKE '%q%' cheap). Public, rate-limited implicitly
 * by PostgREST; returns the minimum fields the dropdown renders.
 */
export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ universities: [], programmes: [] });
  }

  const supabase = await createServerSupabaseClient();
  const like = `%${q}%`;

  const [unis, programmes] = await Promise.all([
    supabase
      .from("universities")
      .select("id, name, city, country_code")
      .ilike("name", like)
      .eq("published", true)
      .limit(5),
    supabase
      .from("programmes")
      .select("id, name, degree_level, universities(name)")
      .ilike("name", like)
      .eq("published", true)
      .limit(6),
  ]);

  return NextResponse.json({
    universities: unis.data ?? [],
    programmes: programmes.data ?? [],
  });
}