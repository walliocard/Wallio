import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "red-cream", name: "Red / Cream", tokens: { background: "#CC1818", surface: "#AA1010", surfaceSecondary: "#880808", text: "#FAF0E0", textSecondary: "#F0D0A0", textTertiary: "#C09050", accent: "#FAF0E0", accentSecondary: "#F0D0A0", stampActive: "#FAF0E0", stampActiveIcon: "#CC1818", stampInactive: "#880808", border: "#AA1010", borderStrong: "#880808", qrBackground: "#FAF0E0", qrForeground: "#CC1818", rewardBackground: "#AA1010" } },
  { id: "blue-yellow", name: "Blue / Yellow", tokens: { background: "#0A28C0", surface: "#0820A0", surfaceSecondary: "#061880", text: "#FFEE00", textSecondary: "#FFD000", textTertiary: "#B09000", accent: "#FFEE00", accentSecondary: "#FFD000", stampActive: "#FFEE00", stampActiveIcon: "#0A28C0", stampInactive: "#061880", border: "#082090", borderStrong: "#061880", qrBackground: "#FFFFFF", qrForeground: "#0A28C0", rewardBackground: "#0820A0" } },
  { id: "orange-purple", name: "Orange / Purple", tokens: { background: "#E05010", surface: "#C04008", surfaceSecondary: "#A03000", text: "#FFFFFF", textSecondary: "#E0A0FF", textTertiary: "#805080", accent: "#D060FF", accentSecondary: "#B040E0", stampActive: "#D060FF", stampActiveIcon: "#E05010", stampInactive: "#A03000", border: "#B03800", borderStrong: "#903000", qrBackground: "#FFFFFF", qrForeground: "#E05010", rewardBackground: "#C04008" } },
];

const template: CardTemplate = {
  id: "25-poster", name: "POSTER", subtitle: "Modern Poster",
  description: "Carte = affiche miniature. Titre énorme, composition dynamique.",
  categories: ["colorful", "street", "editorial"],
  palettes, defaultPaletteId: "red-cream",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "'Impact', 'Arial Black', sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Bande de texte répétitif en fond */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: thumbnail ? "30%" : "35%", background: tokens.surface, opacity: 0.6 }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "5% 6%" : "6% 7%", position: "relative", zIndex: 1 }}>
          {/* Titre immense */}
          <div>
            <div style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.25em", color: tokens.textTertiary, marginBottom: 2 }}>— FIDÉLITÉ —</div>
            <div style={{ fontSize: thumbnail ? 16 : 28, fontWeight: 900, color: tokens.accent, lineHeight: 0.9, textTransform: "uppercase", letterSpacing: -1 }}>
              {(data.nom || "POSTER").toUpperCase().slice(0, 7)}
            </div>
          </div>

          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="circle" tokens={tokens} size={thumbnail ? 8 : 14} gap={thumbnail ? 2 : 4} perRow={9}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 5 : 7, color: tokens.textSecondary }}>
              {filled}/{data.objectif_tampons} — {data.nom_recompense.toUpperCase()}
            </div>
            {!thumbnail && <QRBox size={26} bg={tokens.qrBackground} fg={tokens.background} radius={0}/>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
