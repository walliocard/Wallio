import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "purple-blue", name: "Purple / Blue", tokens: { background: "#08040E", surface: "#120818", surfaceSecondary: "#1C0C24", text: "#FFFFFF", textSecondary: "#B060FF", textTertiary: "#503060", accent: "#B060FF", accentSecondary: "#6080FF", stampActive: "#B060FF", stampActiveIcon: "#08040E", stampInactive: "#1C0C24", border: "#2C1840", borderStrong: "#503060", qrBackground: "#FFFFFF", qrForeground: "#08040E", rewardBackground: "#120818" } },
  { id: "pink-orange", name: "Pink / Orange", tokens: { background: "#0E0408", surface: "#180810", surfaceSecondary: "#240C18", text: "#FFFFFF", textSecondary: "#FF4080", textTertiary: "#602030", accent: "#FF4080", accentSecondary: "#FF8040", stampActive: "#FF4080", stampActiveIcon: "#0E0408", stampInactive: "#240C18", border: "#3A1020", borderStrong: "#602030", qrBackground: "#FFFFFF", qrForeground: "#0E0408", rewardBackground: "#180810" } },
  { id: "green-cyan", name: "Green / Cyan", tokens: { background: "#020E0A", surface: "#041814", surfaceSecondary: "#08241E", text: "#FFFFFF", textSecondary: "#00FF90", textTertiary: "#004030", accent: "#00FF90", accentSecondary: "#00D0C0", stampActive: "#00FF90", stampActiveIcon: "#020E0A", stampInactive: "#08241E", border: "#0C3020", borderStrong: "#185040", qrBackground: "#FFFFFF", qrForeground: "#020E0A", rewardBackground: "#041814" } },
];

const template: CardTemplate = {
  id: "21-neon", name: "NEON", subtitle: "Night Life",
  description: "Fond sombre profond, accents lumineux néon, tampons comme points brillants.",
  categories: ["colorful", "street", "modern"],
  palettes, defaultPaletteId: "purple-blue",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 16 : (dims?.logoSize ?? 28);
    const fmtV = dims?.format === "compact" ? 0.68 : dims?.format === "wide" ? 0.52 : 1;

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Glow néon — halo ambiant très subtil */}
        <div style={{
          position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
          width: thumbnail ? 70 : 130, height: thumbnail ? 70 : 130, borderRadius: "50%",
          background: tokens.accent, opacity: 0.05, pointerEvents: "none",
        }}/>

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
                width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: thumbnail ? 5 : 8,
                background: `${tokens.accent}30`, backdropFilter: "blur(8px)",
                border: `1px solid ${tokens.accent}50`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.accent }}>
                  {(data.nom[0] || "W").toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 700, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>
                {data.nom || "NEON"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>
                  {data.slogan}
                </div>
              )}
            </div>
          </div>
          {/* Badge WALLIO néon */}
          <div style={{
            background: `${tokens.accent}20`, backdropFilter: "blur(10px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: `1px solid ${tokens.accent}40`, flexShrink: 0,
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS — points lumineux néon */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: thumbnail ? 4 : 7, width: "100%" }}>
            {Array.from({ length: data.objectif_tampons }).map((_, i) => {
              const on = i < filled;
              return (
                <div key={i} style={{
                  width: thumbnail ? 7 : 14, height: thumbnail ? 7 : 14, borderRadius: "50%",
                  background: on ? tokens.accent : tokens.stampInactive,
                  boxShadow: on ? `0 0 ${thumbnail ? 5 : 10}px ${tokens.accent}80` : "none",
                  flexShrink: 0,
                }}/>
              );
            })}
          </div>
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
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.textSecondary }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}20`, backdropFilter: "blur(10px)",
            borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: `1px solid ${tokens.accent}35`,
          }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(12), fontWeight: 700, color: tokens.accent }}>
              {filled}/{data.objectif_tampons}
            </span>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
