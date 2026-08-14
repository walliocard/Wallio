import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "concrete-black", name: "Concrete / Black", tokens: { background: "#C8C4BE", surface: "#B8B4AE", surfaceSecondary: "#A8A49E", text: "#0A0A0A", textSecondary: "#2A2A2A", textTertiary: "#6A6A6A", accent: "#0A0A0A", accentSecondary: "#2A2A2A", stampActive: "#0A0A0A", stampActiveIcon: "#C8C4BE", stampInactive: "#A8A49E", border: "#989490", borderStrong: "#787470", qrBackground: "#FFFFFF", qrForeground: "#0A0A0A", rewardBackground: "#B8B4AE" } },
  { id: "charcoal-cream", name: "Charcoal / Cream", tokens: { background: "#2C2C2C", surface: "#3C3C3C", surfaceSecondary: "#4C4C4C", text: "#F0EDE8", textSecondary: "#C0BDB8", textTertiary: "#707070", accent: "#F0EDE8", accentSecondary: "#C0BDB8", stampActive: "#F0EDE8", stampActiveIcon: "#2C2C2C", stampInactive: "#4C4C4C", border: "#444444", borderStrong: "#585858", qrBackground: "#F0EDE8", qrForeground: "#2C2C2C", rewardBackground: "#3C3C3C" } },
  { id: "sand-black", name: "Sand / Black", tokens: { background: "#E0D8C8", surface: "#D0C8B4", surfaceSecondary: "#C0B8A0", text: "#0A0804", textSecondary: "#2A2010", textTertiary: "#6A6050", accent: "#0A0804", accentSecondary: "#2A2010", stampActive: "#0A0804", stampActiveIcon: "#E0D8C8", stampInactive: "#C0B8A0", border: "#B0A890", borderStrong: "#908870", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#D0C8B4" } },
];

const template: CardTemplate = {
  id: "20-concrete", name: "CONCRETE", subtitle: "Architectural",
  description: "Béton, grille, géométrie pure. Lignes et numéros comme éléments de design.",
  categories: ["minimal", "editorial", "street"],
  palettes, defaultPaletteId: "concrete-black",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "'Helvetica Neue', Arial, sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Grille architecturale */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${tokens.border}33 1px, transparent 1px), linear-gradient(90deg, ${tokens.border}33 1px, transparent 1px)`, backgroundSize: thumbnail ? "20px 20px" : "36px 36px", opacity: 0.5 }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.2em", color: tokens.textTertiary }}>STRUCT</div>
              <div style={{ fontSize: thumbnail ? 8 : 13, fontWeight: 700, color: tokens.text }}>{data.nom || "CONCRETE"}</div>
            </div>
            <div style={{ border: `1px solid ${tokens.borderStrong}`, padding: thumbnail ? "2px 5px" : "3px 8px" }}>
              <div style={{ fontSize: thumbnail ? 8 : 14, fontWeight: 900, color: tokens.accent }}>{filled}</div>
            </div>
          </div>

          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="square" tokens={tokens} size={thumbnail ? 8 : 14} gap={thumbnail ? 2 : 4} perRow={9}/>

          <div style={{ borderTop: `1px solid ${tokens.borderStrong}`, paddingTop: thumbnail ? 4 : 7, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: thumbnail ? 5 : 7, color: tokens.textSecondary }}>{data.nom_recompense} / {data.objectif_tampons}</div>
            {!thumbnail && <QRBox size={28} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={0}/>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
