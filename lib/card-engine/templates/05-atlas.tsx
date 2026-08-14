import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "sand-terracotta", name: "Sand / Terracotta", tokens: { background: "#F2E8D5", surface: "#E8D8C0", surfaceSecondary: "#D8C4A8", text: "#2A1A0E", textSecondary: "#7A4A2A", textTertiary: "#B08060", accent: "#C05A30", accentSecondary: "#E07A50", stampActive: "#C05A30", stampActiveIcon: "#F2E8D5", stampInactive: "#D8C4A8", border: "#D0BC98", borderStrong: "#B8A080", qrBackground: "#FFFFFF", qrForeground: "#2A1A0E", rewardBackground: "#E8D8C0" } },
  { id: "cream-deep-blue", name: "Cream / Deep Blue", tokens: { background: "#F5F0E8", surface: "#E8E0D0", surfaceSecondary: "#D8D0BC", text: "#0E1E3A", textSecondary: "#2A3E6A", textTertiary: "#7A8EAA", accent: "#1A2E5A", accentSecondary: "#2A4E8A", stampActive: "#1A2E5A", stampActiveIcon: "#F5F0E8", stampInactive: "#D8D0BC", border: "#C8C0A8", borderStrong: "#A8A088", qrBackground: "#FFFFFF", qrForeground: "#0E1E3A", rewardBackground: "#E8E0D0" } },
  { id: "olive-clay", name: "Olive / Clay", tokens: { background: "#EAE8DC", surface: "#D8D4C4", surfaceSecondary: "#C4BEA8", text: "#1A1C0E", textSecondary: "#4A4E2A", textTertiary: "#8A8E6A", accent: "#6A6A30", accentSecondary: "#9A9A50", stampActive: "#6A6A30", stampActiveIcon: "#EAE8DC", stampInactive: "#C4BEA8", border: "#C0BC98", borderStrong: "#A0A070", qrBackground: "#FFFFFF", qrForeground: "#1A1C0E", rewardBackground: "#D8D4C4" } },
];

const template: CardTemplate = {
  id: "05-atlas", name: "ATLAS", subtitle: "Mediterranean Contemporary",
  description: "Arches, formes architecturales, chaleur méditerranéenne.",
  categories: ["restaurant", "premium", "artistic"],
  palettes, defaultPaletteId: "sand-terracotta",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const a = thumbnail ? 0.5 : 1;
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", position: "relative", fontFamily: "Georgia, 'Times New Roman', serif", overflow: "hidden" }}>
        {/* Grande arche décorative */}
        <svg style={{ position: "absolute", right: 0, top: 0, height: "100%", width: thumbnail ? "35%" : "40%", opacity: 0.18 }} viewBox="0 0 150 246" preserveAspectRatio="none">
          <path d="M150 0 L50 0 A80 120 0 0 0 50 240 L150 240 Z" fill={tokens.accent}/>
          <path d="M150 20 L70 20 A60 100 0 0 0 70 220 L150 220 Z" fill={tokens.background}/>
        </svg>
        {/* Contenu */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: `${6*a}% ${7*a}%`, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 5 : 8, letterSpacing: "0.2em", color: tokens.accent, fontWeight: 600, marginBottom: 3 }}>
              {(data.nom || "ÉTABLISSEMENT").toUpperCase()}
            </div>
            {data.slogan && !thumbnail && <div style={{ fontSize: 9, color: tokens.textSecondary, fontStyle: "italic" }}>{data.slogan}</div>}
          </div>
          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="dot" tokens={tokens} size={thumbnail ? 7 : 13} gap={thumbnail ? 3 : 5} perRow={9}/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary }}>{data.nom_recompense}</div>
              <div style={{ fontSize: thumbnail ? 6 : 10, fontWeight: 600, color: tokens.text, marginTop: 2 }}>{filled}/{data.objectif_tampons}</div>
            </div>
            {!thumbnail && <div style={{ background: tokens.surface, padding: 4, borderRadius: 20 }}><QRBox size={34} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={12}/></div>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
