import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  {
    id: "blue-purple", name: "Blue / Purple",
    tokens: {
      background: "#0A0820", surface: "rgba(255,255,255,0.08)", surfaceSecondary: "rgba(255,255,255,0.04)",
      text: "#FFFFFF", textSecondary: "rgba(255,255,255,0.7)", textTertiary: "rgba(255,255,255,0.4)",
      accent: "#6E8EFF", accentSecondary: "#BF8EFF",
      stampActive: "#FFFFFF", stampActiveIcon: "#0A0820", stampInactive: "rgba(255,255,255,0.15)",
      border: "rgba(255,255,255,0.12)", borderStrong: "rgba(255,255,255,0.2)",
      qrBackground: "#FFFFFF", qrForeground: "#0A0820",
      rewardBackground: "rgba(255,255,255,0.06)",
    },
  },
  {
    id: "orange-pink", name: "Orange / Pink",
    tokens: {
      background: "#1A0810", surface: "rgba(255,255,255,0.08)", surfaceSecondary: "rgba(255,255,255,0.04)",
      text: "#FFFFFF", textSecondary: "rgba(255,255,255,0.7)", textTertiary: "rgba(255,255,255,0.4)",
      accent: "#FF8040", accentSecondary: "#FF40A0",
      stampActive: "#FFFFFF", stampActiveIcon: "#1A0810", stampInactive: "rgba(255,255,255,0.15)",
      border: "rgba(255,255,255,0.12)", borderStrong: "rgba(255,255,255,0.2)",
      qrBackground: "#FFFFFF", qrForeground: "#1A0810",
      rewardBackground: "rgba(255,255,255,0.06)",
    },
  },
  {
    id: "green-cyan", name: "Green / Cyan",
    tokens: {
      background: "#041412", surface: "rgba(255,255,255,0.08)", surfaceSecondary: "rgba(255,255,255,0.04)",
      text: "#FFFFFF", textSecondary: "rgba(255,255,255,0.7)", textTertiary: "rgba(255,255,255,0.4)",
      accent: "#00E5A0", accentSecondary: "#00C0E0",
      stampActive: "#FFFFFF", stampActiveIcon: "#041412", stampInactive: "rgba(255,255,255,0.15)",
      border: "rgba(255,255,255,0.12)", borderStrong: "rgba(255,255,255,0.2)",
      qrBackground: "#FFFFFF", qrForeground: "#041412",
      rewardBackground: "rgba(255,255,255,0.06)",
    },
  },
];

const template: CardTemplate = {
  id: "08-wave",
  name: "WAVE",
  subtitle: "Modern Gradient",
  description: "Gradient fluide, formes abstraites, typographie blanche. Contemporain et dynamique.",
  categories: ["colorful", "modern", "street"],
  palettes,
  defaultPaletteId: "blue-purple",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{
        width: "100%", height: "100%", position: "relative",
        background: tokens.background, overflow: "hidden",
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', Inter, sans-serif",
      }}>
        {/* Gradient wave SVG */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 375 246" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`wg-${tokens.accent}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={tokens.accent} stopOpacity="0.5"/>
              <stop offset="100%" stopColor={tokens.accentSecondary} stopOpacity="0.35"/>
            </linearGradient>
          </defs>
          <path d="M-20 180 C80 120 200 220 375 130 L375 0 L-20 0 Z" fill={`url(#wg-${tokens.accent})`}/>
          <path d="M-20 220 C100 160 250 260 395 170 L395 246 L-20 246 Z" fill={tokens.accentSecondary} fillOpacity="0.15"/>
        </svg>

        {/* Contenu */}
        <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "5.5% 6%" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {data.logo_url ? (
                <img src={data.logo_url} alt="" style={{ width: thumbnail ? 16 : 26, height: thumbnail ? 16 : 26, borderRadius: 6, objectFit: "cover" }}/>
              ) : null}
              <span style={{ fontSize: thumbnail ? 8 : 13, fontWeight: 700, color: tokens.text }}>
                {data.nom || "Établissement"}
              </span>
            </div>
            <span style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.12em", color: tokens.textTertiary }}>WALLIO</span>
          </div>

          {/* Tampons bulles */}
          <Stamps
            total={data.objectif_tampons} filled={filled}
            style="circle" tokens={tokens}
            size={thumbnail ? 10 : 18} gap={thumbnail ? 3 : 5} perRow={9}
          />

          {/* Zone QR + info */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 6 : 9, color: tokens.textTertiary }}>{data.nom_recompense}</div>
              <div style={{ fontSize: thumbnail ? 7 : 10, fontWeight: 600, color: tokens.text, marginTop: 2 }}>
                {filled}/{data.objectif_tampons}
              </div>
            </div>
            {!thumbnail && (
              <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", padding: 4, borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)" }}>
                <QRBox size={36} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={4}/>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
};

export default template;
