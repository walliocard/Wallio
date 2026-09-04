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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #EEF2F7 0%, #E4ECF8 50%, #EAE8F5 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Halo */}
        <div style={{
          position: "absolute",
          top: -100, left: "50%", transform: "translateX(-50%)",
          width: 800, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(91,124,250,0.18) 0%, transparent 65%)",
          display: "flex",
        }} />

        {/* Card */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255,255,255,0.80)",
          border: "1.5px solid rgba(255,255,255,0.9)",
          borderRadius: 40,
          padding: "56px 80px",
          boxShadow: "0 24px 80px rgba(100,120,160,0.18)",
        }}>
          {/* Logo W */}
          <div style={{
            width: 100, height: 100, borderRadius: 28,
            background: "linear-gradient(135deg, #EDE8FF 0%, #E8F0FF 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 12px 40px rgba(91,124,250,0.25)",
            marginBottom: 28,
          }}>
            <span style={{ fontSize: 60, fontWeight: 900, background: "linear-gradient(135deg, #5B7CFA, #7C5BFA)", backgroundClip: "text", color: "transparent" }}>W</span>
          </div>

          <span style={{ fontSize: 64, fontWeight: 800, color: "#1C2333", letterSpacing: -2, marginBottom: 16 }}>
            Wallio
          </span>
          <span style={{ fontSize: 28, color: "#6E7A8A", fontWeight: 400, textAlign: "center", maxWidth: 600 }}>
            Cartes de fidélité digitales
          </span>

          {/* Pills */}
          <div style={{ display: "flex", gap: 14, marginTop: 36 }}>
            {["NFC", "Apple Wallet", "Google Wallet"].map(t => (
              <div key={t} style={{
                padding: "10px 22px", borderRadius: 50,
                background: "rgba(91,124,250,0.1)", border: "1px solid rgba(91,124,250,0.2)",
                color: "#5B7CFA", fontSize: 18, fontWeight: 600,
                display: "flex",
              }}>{t}</div>
            ))}
          </div>
        </div>

        {/* URL */}
        <div style={{ position: "absolute", bottom: 36, color: "#8E9BB5", fontSize: 22, display: "flex" }}>
          app.walliocard.com
        </div>
      </div>
    ),
    { ...size }
  );
}
