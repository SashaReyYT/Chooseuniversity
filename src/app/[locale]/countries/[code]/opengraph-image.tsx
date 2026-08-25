import { ImageResponse } from "next/og";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 86400;

interface Props {
  params: Promise<{ locale: string; code: string }>;
}

/** Dynamic OG card for country landing pages. */
export default async function OpengraphImage({ params }: Props) {
  const { code } = await params;
  const upper = code.toUpperCase();
  const supabase = await createServerSupabaseClient();

  const { count } = await supabase
    .from("universities")
    .select("id", { count: "exact", head: true })
    .eq("country_code", upper)
    .eq("published", true);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg,#001c10 0%,#003321 100%)",
          padding: 64,
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.85, letterSpacing: 2 }}>UNIFIND</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 72, fontWeight: 700 }}>Study in {upper}</div>
          <div style={{ fontSize: 36, opacity: 0.9 }}>
            {(count ?? 0).toLocaleString()} universities in the catalogue
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.7 }}>
          Match scores across nine dimensions
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}