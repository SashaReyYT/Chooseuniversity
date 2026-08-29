import { ImageResponse } from "next/og";

export const revalidate = 86400;

/** Static OG card for the homepage — brand name + tagline. */
export default function OpengraphImage() {
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
        <div style={{ fontSize: 28, opacity: 0.85, letterSpacing: 2 }}>UNICHOOSE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: 1000,
            }}
          >
            Find your best-fit university
          </div>
          <div style={{ fontSize: 32, opacity: 0.9 }}>
            Compare tuition, requirements & match scores across 60+ countries
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.7 }}>
          unikchoose.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
