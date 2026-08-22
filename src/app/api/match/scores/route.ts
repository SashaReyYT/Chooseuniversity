import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MatchingService } from "@/lib/services/matching.service";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const matchingService = new MatchingService(supabase);
    const matches = await matchingService.listMatchesForUser(user.id);
    
    const scores: Record<string, number> = {};
    const programmes: Record<string, { name: string; university: string }> = {};
    
    for (const match of matches) {
      if (match.match.overallScore != null) {
        scores[match.programme.id] = match.match.overallScore;
        programmes[match.programme.id] = {
          name: match.programme.name,
          university: match.programme.university.name,
        };
      }
    }
    
    return NextResponse.json({ scores, programmes });
  } catch (error) {
    console.error("Failed to fetch match scores:", error);
    return NextResponse.json({ error: "Failed to fetch match scores" }, { status: 500 });
  }
}