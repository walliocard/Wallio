import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "cream-black", name: "Cream / Black", tokens: { background: "#F8F5EE", surface: "#EDE8DC", surfaceSecondary: "#DED8C8", text: "#0A0A0A", textSecondary: "#3A3A3A", textTertiary: "#9A9A9A", accent: "#0A0A0A", accentSecondary: "#3A3A3A", stampActive: "#0A0A0A", stampActiveIcon: "#F8F5EE", stampInactive: "#DED8C8", border: "#C8C4BC", borderStrong: "#A8A49C", qrBackground: "#FFFFFF", qrForeground: "#0A0A0A", rewardBackground: "#EDE8DC" } },
  { id: "grey-cobalt", name: "Grey / Cobalt", tokens: { background: "#E8E8EC", surface: "#D8D8E0", surfaceSecondary: "#C8C8D4", text: "#0A0C20", textSecondary: "#2030A0", textTertiary: "#6070C0", accent: "#1428A0", accentSecondary: "#2040D0", stampActive: "#1428A0", stampActiveIcon: "#E8E8EC", stampInactive: "#C8C8D4", border: "#B8B8CC", borderStrong: "#9898B0", qrBackground: "#FFFFFF", qrForeground: "#0A0C20", rewardBackground: "#D8D8E0" } },
  { id: "black-white", name: "Black / White", tokens: { background: "#0A0A0A", surface: "#141414", surfaceSecondary: "#202020", text: "#FFFFFF", textSecondary: "#AAAAAA", textTertiary: "#555555", accent: "#FFFFFF", accentSecondary: "#AAAAAA", stampActive: "#FFFFFF", stampActiveIcon: "#0A0A0A", stampInactive: "#202020", border: "#282828", borderStrong: "#383838", qrBackground: "#FFFFFF", qrForeground: "#0A0A0A", rewardBackground: "#141414" } },
];

const template: CardTemplate = {
  id: "19-gallery", name: "GALLERY", subtitle: "Art Gallery",
  description: "Espaces vides immenses, élément graphique central, QR quasi caché.",
  categories: ["minimal", "artistic", "editorial"],
  palettes, defaultPaletteId: "cream-black",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "'Helvetica Neue', Arial, sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Élément graphique central — cercle vide */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: thumbnail ? 50 : 90, height: thumbnail ? 50 : 90, borderRadius: "50%", border: `1px solid ${tokens.border}`, opacity: 0.5 }}/>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: thumbnail ? 25 : 45, height: thumbnail ? 25 : 45, borderRadius: "50%", background: tokens.border, opacity: 0.2 }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "7% 8%" : "8% 9%", position: "relative", zIndex: 1 }}>
          {/* Haut — minuscule */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: thumbnail ? 5 : 8, letterSpacing: "0.15em", color: tokens.textTertiary }}>{(data.nom || "GALLERY").toUpperCase().slice(0, 8)}</span>
            <span style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textTertiary }}>{filled}/{data.objectif_tampons}</span>
          </div>

          {/* Centre — vide intentionnel */}
          <div/>

          {/* Bas — tampons points minuscules + QR */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="dot" tokens={tokens} size={thumbnail ? 5 : 9} gap={thumbnail ? 2 : 4} perRow={10}/>
            {!thumbnail && <div style={{ opacity: 0.6 }}><QRBox size={24} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={0}/></div>}
          </div>
          <div style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textTertiary, marginTop: 4 }}>{data.nom_recompense}</div>
        </div>
      </div>
    );
  },
};
export default template;
