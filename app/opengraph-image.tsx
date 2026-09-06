import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Wallio — Cartes de fidélité digitales";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F7F9FF 0%, #F1F4FF 48%, #F4F0FF 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        <div style={{
          position: "absolute",
          left: 190,
          top: 90,
          width: 820,
          height: 450,
          borderRadius: 54,
          background: "rgba(255,255,255,0.65)",
          border: "1.5px solid rgba(255,255,255,0.9)",
          boxShadow: "0 24px 70px rgba(120, 132, 176, 0.16)",
        }} />

        <div style={{
          position: "absolute",
          left: 300,
          top: 140,
          width: 600,
          height: 330,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 230,
            height: 230,
            borderRadius: 70,
            background: "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(243,247,255,0.7))",
            boxShadow: "0 18px 50px rgba(94, 108, 232, 0.12)",
            marginBottom: 18,
          }}>
            <div style={{
              position: "absolute",
              inset: 18,
              borderRadius: 58,
              background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.8), rgba(255,255,255,0) 60%)",
            }} />
            <span style={{
              fontSize: 150,
              fontWeight: 900,
              lineHeight: 1,
              background: "linear-gradient(135deg, #007AFF 0%, #2F63FF 35%, #665CF8 68%, #9B5CF6 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: "drop-shadow(0 12px 16px rgba(76,84,219,0.18))",
            }}>W</span>
          </div>

          <span style={{ fontSize: 60, fontWeight: 800, color: "#191D2A", letterSpacing: -2, marginBottom: 8 }}>
            Wallio
          </span>
          <span style={{ fontSize: 24, color: "#6E7B93", fontWeight: 500 }}>
            Cartes de fidélité digitales
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
