import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "ink-cream", name: "Ink / Cream", tokens: { background: "#F0EAD8", surface: "#E4DCC4", surfaceSecondary: "#D4CCAC", text: "#080604", textSecondary: "#282010", textTertiary: "#706040", accent: "#080604", accentSecondary: "#282010", stampActive: "#080604", stampActiveIcon: "#F0EAD8", stampInactive: "#D4CCAC", border: "#C4B888", borderStrong: "#A09860", qrBackground: "#FFFFFF", qrForeground: "#080604", rewardBackground: "#E4DCC4" } },
  { id: "prussian-cream", name: "Prussian / Cream", tokens: { background: "#EEF0F4", surface: "#DDE0E8", surfaceSecondary: "#CDD0DC", text: "#060A14", textSecondary: "#0E1C38", textTertiary: "#6880A0", accent: "#0E1C38", accentSecondary: "#1A2E58", stampActive: "#0E1C38", stampActiveIcon: "#EEF0F4", stampInactive: "#CDD0DC", border: "#C0C8D8", borderStrong: "#A0A8C0", qrBackground: "#FFFFFF", qrForeground: "#060A14", rewardBackground: "#DDE0E8" } },
  { id: "sienna-sand", name: "Sienna / Sand", tokens: { background: "#F2E4CC", surface: "#E4D0B0", surfaceSecondary: "#D4BC94", text: "#140804", textSecondary: "#5A2810", textTertiary: "#9A7040", accent: "#7A2808", accentSecondary: "#AA3810", stampActive: "#7A2808", stampActiveIcon: "#F2E4CC", stampInactive: "#D4BC94", border: "#C8B080", borderStrong: "#A88858", qrBackground: "#FFFFFF", qrForeground: "#140804", rewardBackground: "#E4D0B0" } },
];

const template: CardTemplate = {
  id: "38-press", name: "PRESS", subtitle: "Letterpress",
  description: "Imprimerie artisanale, texte debossé, encrage à plat, typographie régnante.",
  categories: ["retro", "editorial", "coffee"],
  palettes, defaultPaletteId: "ink-cream",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "'Courier New', 'Courier', monospace", position: "relative", overflow: "hidden" }}>
        {/* Cadre letterpress */}
        <div style={{ position: "absolute", inset: thumbnail ? 3 : 6, border: `${thumbnail ? 0.5 : 1}px solid ${tokens.borderStrong}`, opacity: 0.4 }}/>
        <div style={{ position: "absolute", inset: thumbnail ? 5 : 9, border: `${thumbnail ? 0.5 : 1}px solid ${tokens.accent}`, opacity: 0.15 }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "10% 10%" : "12% 11%", position: "relative", zIndex: 1 }}>
          {/* En-tête typographique */}
          <div style={{ borderBottom: `${thumbnail ? 0.5 : 1}px solid ${tokens.borderStrong}`, paddingBottom: thumbnail ? 3 : 5 }}>
            <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.25em", color: tokens.textTertiary, marginBottom: 2 }}>CARTE DE FIDÉLITÉ</div>
            <div style={{ fontSize: thumbnail ? 9 : 15, fontWeight: 700, color: tokens.text, letterSpacing: "0.06em", textTransform: "uppercase" }}>{data.nom || "The Press"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
          </div>

          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined} total={data.objectif_tampons} filled={filled} style="badge" tokens={tokens} size={thumbnail ? 9 : 16} gap={thumbnail ? 3 : 5} perRow={8}/>

          {/* Pied de page */}
          <div style={{ borderTop: `${thumbnail ? 0.5 : 1}px solid ${tokens.borderStrong}`, paddingTop: thumbnail ? 3 : 5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 3 : 5, letterSpacing: "0.15em", color: tokens.textTertiary }}>{filled}/{data.objectif_tampons} POINTS</div>
              <div style={{ fontSize: thumbnail ? 4 : 6, color: tokens.text, marginTop: 1 }}>{data.nom_recompense.toUpperCase()}</div>
            </div>
            <div style={{ fontSize: thumbnail ? 6 : 10, fontWeight: 700, color: tokens.textSecondary }}>{filled}/{data.objectif_tampons}</div>
          </div>
        </div>

        {/* Watermark WALLIO lettrepress */}
        <div style={{ position: "absolute", bottom: thumbnail ? 5 : 8, left: "50%", transform: "translateX(-50%)", fontSize: thumbnail ? 3 : 4, letterSpacing: "0.3em", color: tokens.textTertiary, opacity: 0.4 }}>WALLIO</div>
      </div>
    );
  },
};
export default template;
