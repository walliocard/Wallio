import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "sage-cream", name: "Sage / Cream", tokens: { background: "#E8F0E8", surface: "#D4E4D4", surfaceSecondary: "#C0D4C0", text: "#0E1A0E", textSecondary: "#3A5A3A", textTertiary: "#7A9A7A", accent: "#3A6A3A", accentSecondary: "#5A9A5A", stampActive: "#3A6A3A", stampActiveIcon: "#E8F0E8", stampInactive: "#C0D4C0", border: "#B4CDB4", borderStrong: "#90B090", qrBackground: "#FFFFFF", qrForeground: "#0E1A0E", rewardBackground: "#D4E4D4" } },
  { id: "peach-burgundy", name: "Peach / Burgundy", tokens: { background: "#F5E8DC", surface: "#EAD4C4", surfaceSecondary: "#DAC0AA", text: "#1A0808", textSecondary: "#6A2028", textTertiary: "#AA7870", accent: "#8A2030", accentSecondary: "#BA3040", stampActive: "#8A2030", stampActiveIcon: "#F5E8DC", stampInactive: "#DAC0AA", border: "#D0B4A0", borderStrong: "#B09080", qrBackground: "#FFFFFF", qrForeground: "#1A0808", rewardBackground: "#EAD4C4" } },
  { id: "sky-sand", name: "Sky / Sand", tokens: { background: "#E0EEF5", surface: "#C8DDE8", surfaceSecondary: "#B0CCDA", text: "#081828", textSecondary: "#205080", textTertiary: "#6090B0", accent: "#1860A0", accentSecondary: "#2880D0", stampActive: "#1860A0", stampActiveIcon: "#E0EEF5", stampInactive: "#B0CCDA", border: "#A0C4D8", borderStrong: "#78A8C0", qrBackground: "#FFFFFF", qrForeground: "#081828", rewardBackground: "#C8DDE8" } },
];

const template: CardTemplate = {
  id: "29-organic", name: "ORGANIC", subtitle: "Soft Organic",
  description: "Formes fluides, blob shapes, aucune ligne droite dominante.",
  categories: ["nature", "beauty", "minimal"],
  palettes, defaultPaletteId: "sage-cream",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Blob organique */}
        <svg style={{ position: "absolute", right: thumbnail ? "-15%" : "-20%", top: thumbnail ? "-20%" : "-30%", opacity: 0.2 }} width={thumbnail ? 80 : 150} height={thumbnail ? 80 : 150} viewBox="0 0 150 150" fill="none">
          <path d="M75 10 C110 5 145 35 140 75 C135 115 100 140 65 138 C30 136 5 105 8 68 C11 31 40 15 75 10Z" fill={tokens.accent}/>
        </svg>
        <svg style={{ position: "absolute", left: thumbnail ? "-10%" : "-15%", bottom: thumbnail ? "5%" : "8%", opacity: 0.12 }} width={thumbnail ? 50 : 90} height={thumbnail ? 50 : 90} viewBox="0 0 90 90" fill="none">
          <path d="M45 5 C70 0 90 20 88 48 C86 76 62 90 38 87 C14 84 0 62 4 36 C8 10 20 10 45 5Z" fill={tokens.accentSecondary}/>
        </svg>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "7% 8%" : "8% 9%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: thumbnail ? 8 : 13, fontWeight: 600, color: tokens.text }}>{data.nom || "Organic"}</span>
            <span style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.12em", color: tokens.textTertiary }}>WALLIO</span>
          </div>

          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="circle" tokens={tokens} size={thumbnail ? 9 : 16} gap={thumbnail ? 3 : 5} perRow={9}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textSecondary }}>{data.nom_recompense} · {filled}/{data.objectif_tampons}</div>
            {!thumbnail && <div style={{ background: tokens.surface, borderRadius: "50%", padding: 5 }}><QRBox size={30} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={15}/></div>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
