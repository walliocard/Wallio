import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "orange-pink", name: "Orange / Pink", tokens: { background: "#FF4808", surface: "#E83800", surfaceSecondary: "#CC2800", text: "#FFFFFF", textSecondary: "#FF80C0", textTertiary: "#C04060", accent: "#FF60C0", accentSecondary: "#FF80D8", stampActive: "#FFFFFF", stampActiveIcon: "#FF4808", stampInactive: "#CC2800", border: "#E03000", borderStrong: "#C02000", qrBackground: "#FFFFFF", qrForeground: "#FF4808", rewardBackground: "#E83800" } },
  { id: "blue-yellow", name: "Blue / Yellow", tokens: { background: "#0828E0", surface: "#0618C0", surfaceSecondary: "#040CA0", text: "#FFFFFF", textSecondary: "#FFEE00", textTertiary: "#808000", accent: "#FFEE00", accentSecondary: "#FFF060", stampActive: "#FFEE00", stampActiveIcon: "#0828E0", stampInactive: "#040CA0", border: "#0818B0", borderStrong: "#1030D0", qrBackground: "#FFFFFF", qrForeground: "#0828E0", rewardBackground: "#0618C0" } },
  { id: "purple-lime", name: "Purple / Lime", tokens: { background: "#5808D0", surface: "#4800B0", surfaceSecondary: "#380090", text: "#FFFFFF", textSecondary: "#A8FF30", textTertiary: "#508010", accent: "#A8FF30", accentSecondary: "#C8FF60", stampActive: "#A8FF30", stampActiveIcon: "#5808D0", stampInactive: "#380090", border: "#4000A0", borderStrong: "#5010C0", qrBackground: "#FFFFFF", qrForeground: "#5808D0", rewardBackground: "#4800B0" } },
];

const template: CardTemplate = {
  id: "45-energy", name: "ENERGY", subtitle: "Bold Pop",
  description: "Couleurs explosives, typographie immense, formes énergétiques.",
  categories: ["colorful", "sport", "street"],
  palettes, defaultPaletteId: "orange-pink",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "'Impact', 'Arial Black', sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Éclair SVG fond */}
        <svg style={{ position: "absolute", right: thumbnail ? "5%" : "8%", top: "50%", transform: "translateY(-50%)", opacity: 0.12 }} width={thumbnail ? 30 : 55} height={thumbnail ? 45 : 85} viewBox="0 0 55 85" fill="none">
          <path d="M35 5 L10 45 L28 45 L20 80 L48 35 L30 35 Z" fill={tokens.accent}/>
        </svg>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: thumbnail ? 10 : 18, fontWeight: 900, color: "#FFFFFF", textTransform: "uppercase", lineHeight: 0.9, letterSpacing: -1 }}>
              {(data.nom || "ENERGY").slice(0, 7)}
            </div>
            <span style={{ fontSize: thumbnail ? 4 : 6, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>WALLIO</span>
          </div>

          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="star" tokens={tokens} size={thumbnail ? 9 : 16} gap={thumbnail ? 3 : 5} perRow={9}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ background: tokens.accent, borderRadius: thumbnail ? 4 : 6, padding: thumbnail ? "2px 6px" : "4px 10px" }}>
              <span style={{ fontSize: thumbnail ? 5 : 8, fontWeight: 900, color: tokens.background }}>{data.nom_recompense.toUpperCase()}</span>
            </div>
            {!thumbnail && <QRBox size={28} bg={tokens.qrBackground} fg={tokens.background} radius={4}/>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
