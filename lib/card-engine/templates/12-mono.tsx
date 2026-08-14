import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "white-black", name: "White / Black", tokens: { background: "#FFFFFF", surface: "#F0F0F0", surfaceSecondary: "#E0E0E0", text: "#000000", textSecondary: "#404040", textTertiary: "#909090", accent: "#000000", accentSecondary: "#404040", stampActive: "#000000", stampActiveIcon: "#FFFFFF", stampInactive: "#E0E0E0", border: "#D0D0D0", borderStrong: "#A0A0A0", qrBackground: "#FFFFFF", qrForeground: "#000000", rewardBackground: "#F0F0F0" } },
  { id: "black-white", name: "Black / White", tokens: { background: "#000000", surface: "#141414", surfaceSecondary: "#282828", text: "#FFFFFF", textSecondary: "#C0C0C0", textTertiary: "#606060", accent: "#FFFFFF", accentSecondary: "#C0C0C0", stampActive: "#FFFFFF", stampActiveIcon: "#000000", stampInactive: "#282828", border: "#303030", borderStrong: "#484848", qrBackground: "#FFFFFF", qrForeground: "#000000", rewardBackground: "#141414" } },
  { id: "warm-charcoal", name: "Warm White / Charcoal", tokens: { background: "#F8F5F0", surface: "#EAE6E0", surfaceSecondary: "#D8D4CC", text: "#1A1614", textSecondary: "#3E3A34", textTertiary: "#8A8680", accent: "#1A1614", accentSecondary: "#3E3A34", stampActive: "#1A1614", stampActiveIcon: "#F8F5F0", stampInactive: "#D8D4CC", border: "#C8C4BC", borderStrong: "#A8A49C", qrBackground: "#FFFFFF", qrForeground: "#1A1614", rewardBackground: "#EAE6E0" } },
];

const template: CardTemplate = {
  id: "12-mono", name: "MONO", subtitle: "Ultra Monochrome",
  description: "Noir et blanc absolu. Sophistication extrême, aucune couleur.",
  categories: ["minimal", "luxury", "editorial"],
  palettes, defaultPaletteId: "white-black",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", position: "relative", fontFamily: "'Helvetica Neue', Arial, sans-serif", overflow: "hidden" }}>
        {/* Grande typographie fond */}
        <div style={{ position: "absolute", right: thumbnail ? "-2%" : "-3%", bottom: thumbnail ? "-5%" : "-8%", fontSize: thumbnail ? 50 : 90, fontWeight: 900, color: tokens.surface, lineHeight: 1, userSelect: "none", letterSpacing: -5 }}>{data.objectif_tampons}</div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "7% 8%" : "8% 9%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: thumbnail ? 7 : 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: tokens.text }}>{data.nom || "MONO"}</span>
            <span style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.2em", color: tokens.textTertiary }}>FIDÉLITÉ</span>
          </div>

          <div style={{ height: "1px", background: tokens.border }}/>

          <Stamps total={data.objectif_tampons} filled={filled} style="square" tokens={tokens} size={thumbnail ? 8 : 14} gap={thumbnail ? 2 : 4} perRow={9}/>

          <div style={{ height: "1px", background: tokens.border }}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textSecondary }}>{filled}/{data.objectif_tampons} — {data.nom_recompense}</div>
            {!thumbnail && <QRBox size={30} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={0}/>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
