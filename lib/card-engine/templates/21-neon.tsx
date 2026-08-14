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
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "'Helvetica Neue', Arial, sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Glow néon */}
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: thumbnail ? 60 : 110, height: thumbnail ? 60 : 110, borderRadius: "50%", background: tokens.accent, opacity: 0.06, filter: "blur(15px)", pointerEvents: "none" }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: thumbnail ? 8 : 13, fontWeight: 700, color: tokens.text }}>{data.nom || "NEON"}</span>
              {data.slogan && !thumbnail && <div style={{ fontSize: 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400 }}>{data.slogan}</div>}
            </div>
            <span style={{ fontSize: thumbnail ? 4 : 6, color: tokens.accent, letterSpacing: "0.12em" }}>WALLIO</span>
          </div>

          {/* Tampons points lumineux */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: thumbnail ? 4 : 7 }}>
            {Array.from({ length: data.objectif_tampons }).map((_, i) => {
              const on = i < filled;
              return (
                <div key={i} style={{ width: thumbnail ? 7 : 13, height: thumbnail ? 7 : 13, borderRadius: "50%", background: on ? tokens.accent : tokens.stampInactive, boxShadow: on ? `0 0 ${thumbnail ? 4 : 8}px ${tokens.accent}` : "none", flexShrink: 0 }}/>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary }}>{data.nom_recompense}</div>
              <div style={{ fontSize: thumbnail ? 7 : 11, fontWeight: 700, color: tokens.accent }}>{filled}/{data.objectif_tampons}</div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
