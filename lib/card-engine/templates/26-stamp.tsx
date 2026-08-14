import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";

const palettes: CardPalette[] = [
  { id: "navy-cream", name: "Navy / Cream", tokens: { background: "#F5EDD8", surface: "#E8DCC0", surfaceSecondary: "#D8CCA8", text: "#0A1428", textSecondary: "#1E3060", textTertiary: "#6880A0", accent: "#0A1428", accentSecondary: "#1E3060", stampActive: "#0A1428", stampActiveIcon: "#F5EDD8", stampInactive: "#D8CCA8", border: "#C8B888", borderStrong: "#A89868", qrBackground: "#FFFFFF", qrForeground: "#0A1428", rewardBackground: "#E8DCC0" } },
  { id: "burgundy-cream", name: "Burgundy / Cream", tokens: { background: "#F5EDE0", surface: "#E8DCC8", surfaceSecondary: "#D8C8A8", text: "#1E0808", textSecondary: "#5A1818", textTertiary: "#9A6858", accent: "#5A1818", accentSecondary: "#8A2828", stampActive: "#5A1818", stampActiveIcon: "#F5EDE0", stampInactive: "#D8C8A8", border: "#C8A878", borderStrong: "#A88858", qrBackground: "#FFFFFF", qrForeground: "#1E0808", rewardBackground: "#E8DCC8" } },
  { id: "forest-beige", name: "Forest / Beige", tokens: { background: "#F0EDDC", surface: "#E0D8C0", surfaceSecondary: "#D0C8A4", text: "#0A1408", textSecondary: "#1E3818", textTertiary: "#6A7858", accent: "#1A3010", accentSecondary: "#2A5020", stampActive: "#1A3010", stampActiveIcon: "#F0EDDC", stampInactive: "#D0C8A4", border: "#C0B888", borderStrong: "#A09868", qrBackground: "#FFFFFF", qrForeground: "#0A1408", rewardBackground: "#E0D8C0" } },
];

const template: CardTemplate = {
  id: "26-stamp", name: "STAMP", subtitle: "Passport",
  description: "Passeport, cases visa, annotations administratives, QR = zone de contrôle.",
  categories: ["retro", "editorial", "artistic"],
  palettes, defaultPaletteId: "navy-cream",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", position: "relative", fontFamily: "'Courier New', monospace", overflow: "hidden" }}>
        {/* Bande verticale gauche — passeport */}
        <div style={{ width: thumbnail ? 18 : 32, background: tokens.text, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "6% 0", flexShrink: 0 }}>
          <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: thumbnail ? 4 : 6, letterSpacing: "0.15em", color: tokens.background, opacity: 0.7 }}>PASSEPORT FIDÉLITÉ</div>
          
          <div style={{ fontSize: thumbnail ? 4 : 5, color: tokens.background, opacity: 0.5, letterSpacing: "0.1em" }}>WALLIO</div>
        </div>

        {/* Zone principale */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "5% 5%" : "6% 6%" }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.15em", color: tokens.textTertiary }}>NOM DU TITULAIRE</div>
            <div style={{ fontSize: thumbnail ? 7 : 11, fontWeight: 700, color: tokens.text }}>{data.nom || "ÉTABLISSEMENT"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
          </div>

          {/* Cases de tampons style visa */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: thumbnail ? 2 : 3 }}>
            {Array.from({ length: data.objectif_tampons }).map((_, i) => {
              const on = i < filled;
              return (
                <div key={i} style={{ width: thumbnail ? 10 : 18, height: thumbnail ? 10 : 18, border: `1px solid ${on ? tokens.accent : tokens.border}`, background: on ? `${tokens.accent}18` : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {on && <div style={{ width: thumbnail ? 5 : 9, height: thumbnail ? 5 : 9, borderRadius: "50%", background: tokens.accent, opacity: 0.7 }}/>}
                </div>
              );
            })}
          </div>

          <div>
            <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.12em", color: tokens.textTertiary }}>AVANTAGE: {data.nom_recompense.toUpperCase()}</div>
            <div style={{ fontSize: thumbnail ? 4 : 5, color: tokens.textTertiary, opacity: 0.5, marginTop: 2 }}>TAMPONS: {filled}/{data.objectif_tampons}</div>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
