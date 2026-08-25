import { ImageResponse } from "next/og";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const revalidate = 86400;

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

/** Dynamic OG card for university pages — name, city, founded year. */
export default async function OpengraphImage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: uni } = await supabase
    .from("universities")
    .select("name, city, country_code, short_description")
    .eq("id", id)
    .single();

  const title = uni?.name ?? "Unifind";
  const subtitle = uni ? `${uni.city} · ${uni.country_code}` : "Find your best-fit university";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg,#031635 0%,#1a2b4b 100%)",
          padding: 64,
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.85, letterSpacing: 2 }}>UNIFIND</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: title.length > 60 ? 52 : 68,
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 32, opacity: 0.9 }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.7 }}>
          Compare programmes on your terms
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}