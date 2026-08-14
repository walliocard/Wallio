import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "navy-sand", name: "Navy / Sand", tokens: { background: "#0A1E3A", surface: "#142840", surfaceSecondary: "#1E3450", text: "#F5EDD8", textSecondary: "#C0A870", textTertiary: "#605838", accent: "#C0A870", accentSecondary: "#E0C890", stampActive: "#F5EDD8", stampActiveIcon: "#0A1E3A", stampInactive: "#1E3450", border: "#1E3050", borderStrong: "#2E4868", qrBackground: "#F5EDD8", qrForeground: "#0A1E3A", rewardBackground: "#142840" } },
  { id: "sky-cream", name: "Sky / Cream", tokens: { background: "#B8D8F0", surface: "#A0C8E8", surfaceSecondary: "#88B8E0", text: "#081828", textSecondary: "#1A4060", textTertiary: "#508090", accent: "#1040A0", accentSecondary: "#1860D0", stampActive: "#1040A0", stampActiveIcon: "#B8D8F0", stampInactive: "#88B8E0", border: "#98C0D8", borderStrong: "#78A8C8", qrBackground: "#FFFFFF", qrForeground: "#081828", rewardBackground: "#A0C8E8" } },
  { id: "teal-offwhite", name: "Teal / Off White", tokens: { background: "#1A4848", surface: "#224E4E", surfaceSecondary: "#2C5858", text: "#F0EFEA", textSecondary: "#C0D8D0", textTertiary: "#70988E", accent: "#80D0C0", accentSecondary: "#A0E8D8", stampActive: "#F0EFEA", stampActiveIcon: "#1A4848", stampInactive: "#2C5858", border: "#2C5858", borderStrong: "#406868", qrBackground: "#FFFFFF", qrForeground: "#1A4848", rewardBackground: "#224E4E" } },
];

const template: CardTemplate = {
  id: "42-coast", name: "COAST", subtitle: "Coastal",
  description: "Vagues abstraites, lignes fluides, palette côtière.",
  categories: ["nature", "restaurant", "minimal"],
  palettes, defaultPaletteId: "navy-sand",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "-apple-system, sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Vagues SVG */}
        <svg style={{ position: "absolute", bottom: 0, left: 0, right: 0 }} width="100%" height={thumbnail ? "40%" : "45%"} viewBox="0 0 375 110" preserveAspectRatio="none">
          <path d="M-10 110 C60 60 130 90 200 55 C270 20 320 70 385 40 L385 110 Z" fill={tokens.surface} fillOpacity="0.5"/>
          <path d="M-10 110 C80 75 160 100 240 70 C300 50 340 80 385 60 L385 110 Z" fill={tokens.surfaceSecondary} fillOpacity="0.4"/>
        </svg>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: thumbnail ? 8 : 12, fontWeight: 600, color: tokens.text }}>{data.nom || "Coast"}</span>
              {data.slogan && !thumbnail && <div style={{ fontSize: 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic" }}>{data.slogan}</div>}
            </div>
            <span style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.12em", color: tokens.textTertiary }}>WALLIO</span>
          </div>
          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="circle" tokens={tokens} size={thumbnail ? 9 : 16} gap={thumbnail ? 3 : 5} perRow={9}/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textSecondary }}>{data.nom_recompense}</div>
            <div style={{ fontSize: thumbnail ? 5 : 8, fontWeight: 600, color: tokens.textSecondary }}>{filled}/{data.objectif_tampons}</div>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
