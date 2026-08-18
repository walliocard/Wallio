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
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 16 : (dims?.logoSize ?? 28);

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Gradient wave SVG — élément décoratif signature */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 375 246" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`wg-${tokens.accent}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={tokens.accent} stopOpacity="0.45"/>
              <stop offset="100%" stopColor={tokens.accentSecondary} stopOpacity="0.3"/>
            </linearGradient>
          </defs>
          <path d="M-20 180 C80 120 200 220 375 130 L375 0 L-20 0 Z" fill={`url(#wg-${tokens.accent})`}/>
          <path d="M-20 220 C100 160 250 260 395 170 L395 246 L-20 246 Z" fill={tokens.accentSecondary} fillOpacity="0.12"/>
        </svg>

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "6% 7% 3%" : "7% 8% 4%",
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{
                width: thumbnail ? 16 : 28, height: thumbnail ? 16 : 28, borderRadius: thumbnail ? 5 : 8,
                background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: "#FFFFFF" }}>
                  {(data.nom[0] || "W").toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 600, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>
                {data.nom || "Établissement"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>
                  {data.slogan}
                </div>
              )}
            </div>
          </div>
          {/* Badge WALLIO Liquid Glass */}
          <div style={{
            background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0,
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.9)" }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style="circle" tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}
          />
        </div>

        {/* FOOTER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: thumbnail ? "3% 7% 6%" : "4% 8% 7%",
          position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
              Récompense
            </div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)",
            borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: "1px solid rgba(255,255,255,0.2)",
          }}>
            <span style={{ fontSize: thumbnail ? 6 : 11, fontWeight: 700, color: tokens.accent }}>
              {filled}/{data.objectif_tampons}
            </span>
          </div>
        </div>
      </div>
    );
  },
};

export default template;
