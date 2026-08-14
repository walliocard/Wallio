import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "black-white", name: "Black / White", tokens: { background: "#080808", surface: "#141414", surfaceSecondary: "#222222", text: "#FFFFFF", textSecondary: "#888888", textTertiary: "#444444", accent: "#FFFFFF", accentSecondary: "#888888", stampActive: "#FFFFFF", stampActiveIcon: "#080808", stampInactive: "#222222", border: "#252525", borderStrong: "#383838", qrBackground: "#FFFFFF", qrForeground: "#080808", rewardBackground: "#141414" } },
  { id: "cream-burgundy", name: "Cream / Burgundy", tokens: { background: "#F5F0E8", surface: "#E8E0D0", surfaceSecondary: "#D8D0BC", text: "#0A0A0A", textSecondary: "#6A1E2A", textTertiary: "#AA8A90", accent: "#8A1828", accentSecondary: "#C0283C", stampActive: "#8A1828", stampActiveIcon: "#F5F0E8", stampInactive: "#D8D0BC", border: "#D0C8B0", borderStrong: "#B0A890", qrBackground: "#FFFFFF", qrForeground: "#0A0A0A", rewardBackground: "#E8E0D0" } },
  { id: "silver-charcoal", name: "Silver / Charcoal", tokens: { background: "#D0D4D8", surface: "#B8BEC4", surfaceSecondary: "#A0A8B0", text: "#0A0E12", textSecondary: "#283040", textTertiary: "#6070808", accent: "#1C2430", accentSecondary: "#283848", stampActive: "#1C2430", stampActiveIcon: "#D0D4D8", stampInactive: "#A0A8B0", border: "#A0A8B0", borderStrong: "#808890", qrBackground: "#FFFFFF", qrForeground: "#0A0E12", rewardBackground: "#B8BEC4" } },
];

const template: CardTemplate = {
  id: "18-fashion", name: "FASHION", subtitle: "Editorial Fashion",
  description: "Magazine de mode, typographie immense, composition asymétrique.",
  categories: ["editorial", "luxury", "beauty"],
  palettes, defaultPaletteId: "black-white",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", position: "relative", fontFamily: "'Helvetica Neue', Arial, sans-serif", overflow: "hidden" }}>
        {/* Énorme typographie fond */}
        <div style={{ position: "absolute", bottom: thumbnail ? "-10%" : "-15%", left: thumbnail ? "-3%" : "-5%", fontSize: thumbnail ? 45 : 80, fontWeight: 900, color: tokens.surface, lineHeight: 1, letterSpacing: -3, userSelect: "none", textTransform: "uppercase" }}>
          {(data.nom || "FA").slice(0, 2)}
        </div>

        {/* Bande verticale droite */}
        <div style={{ width: thumbnail ? 2 : 4, background: tokens.accent, opacity: 0.8, flexShrink: 0, position: "absolute", right: thumbnail ? 20 : 36, top: 0, bottom: 0 }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.25em", color: tokens.textTertiary }}>N° — {filled}</div>
            <div style={{ fontSize: thumbnail ? 10 : 18, fontWeight: 900, color: tokens.text, textTransform: "uppercase", lineHeight: 0.95, marginTop: 2 }}>
              {data.nom || "FASHION"}
            </div>
          </div>
          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="dot" tokens={tokens} size={thumbnail ? 6 : 11} gap={thumbnail ? 3 : 5} perRow={9}/>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textSecondary }}>{data.nom_recompense} · {filled}/{data.objectif_tampons}</div>
            {!thumbnail && <QRBox size={28} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={0}/>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
