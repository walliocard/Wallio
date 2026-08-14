import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "yellow-terracotta", name: "Yellow / Terracotta", tokens: { background: "#F5D840", surface: "#E8C830", surfaceSecondary: "#D8B820", text: "#1A0A04", textSecondary: "#6A2C10", textTertiary: "#A06030", accent: "#C04820", accentSecondary: "#E06030", stampActive: "#C04820", stampActiveIcon: "#F5D840", stampInactive: "#D8B820", border: "#C8A810", borderStrong: "#A08800", qrBackground: "#FFFFFF", qrForeground: "#1A0A04", rewardBackground: "#E8C830" } },
  { id: "blue-sand", name: "Blue / Sand", tokens: { background: "#1840A0", surface: "#102E80", surfaceSecondary: "#0C2060", text: "#F5EDD0", textSecondary: "#E0C880", textTertiary: "#806840", accent: "#F5D840", accentSecondary: "#F0E060", stampActive: "#F5D840", stampActiveIcon: "#1840A0", stampInactive: "#0C2060", border: "#1A2E68", borderStrong: "#2A4090", qrBackground: "#FFFFFF", qrForeground: "#1840A0", rewardBackground: "#102E80" } },
  { id: "olive-cream", name: "Olive / Cream", tokens: { background: "#8A9040", surface: "#787E30", surfaceSecondary: "#686C20", text: "#F8F2DC", textSecondary: "#E8D880", textTertiary: "#B0A040", accent: "#F8D840", accentSecondary: "#F0E860", stampActive: "#F8F2DC", stampActiveIcon: "#8A9040", stampInactive: "#686C20", border: "#787E30", borderStrong: "#606620", qrBackground: "#FFFFFF", qrForeground: "#8A9040", rewardBackground: "#787E30" } },
];

const template: CardTemplate = {
  id: "41-sun", name: "SUN", subtitle: "Mediterranean",
  description: "Soleil, cercles rayonnants, couleurs chaudes méditerranéennes.",
  categories: ["restaurant", "colorful", "nature"],
  palettes, defaultPaletteId: "yellow-terracotta",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "-apple-system, sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Soleil SVG */}
        <svg style={{ position: "absolute", right: thumbnail ? "-5%" : "-8%", top: "50%", transform: "translateY(-50%)", opacity: 0.2 }} width={thumbnail ? 60 : 110} height={thumbnail ? 60 : 110} viewBox="0 0 110 110" fill="none">
          <circle cx="55" cy="55" r="25" fill={tokens.accent}/>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45) * Math.PI / 180;
            const x1 = 55 + 30 * Math.cos(angle); const y1 = 55 + 30 * Math.sin(angle);
            const x2 = 55 + 48 * Math.cos(angle); const y2 = 55 + 48 * Math.sin(angle);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tokens.accent} strokeWidth="3" strokeLinecap="round"/>;
          })}
        </svg>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: thumbnail ? 8 : 13, fontWeight: 700, color: tokens.text }}>{data.nom || "Soleil"}</span>
            <span style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.12em", color: tokens.textTertiary }}>WALLIO</span>
          </div>
          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="star" tokens={tokens} size={thumbnail ? 9 : 16} gap={thumbnail ? 3 : 5} perRow={9}/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textSecondary }}>{data.nom_recompense} · {filled}/{data.objectif_tampons}</div>
            {!thumbnail && <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: "50%", padding: 4 }}><QRBox size={28} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={14}/></div>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
