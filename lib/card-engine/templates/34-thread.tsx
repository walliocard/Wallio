import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "ivory-sage", name: "Ivory / Sage", tokens: { background: "#F4F0E8", surface: "#E8E2D4", surfaceSecondary: "#D8D0BC", text: "#100E08", textSecondary: "#3A4028", textTertiary: "#8A9070", accent: "#4A5830", accentSecondary: "#687848", stampActive: "#4A5830", stampActiveIcon: "#F4F0E8", stampInactive: "#D8D0BC", border: "#D0C8B0", borderStrong: "#B0A888", qrBackground: "#FFFFFF", qrForeground: "#100E08", rewardBackground: "#E8E2D4" } },
  { id: "blush-cocoa", name: "Blush / Cocoa", tokens: { background: "#F5E8E4", surface: "#ECD8D0", surfaceSecondary: "#DEC8BC", text: "#180C0A", textSecondary: "#5A2818", textTertiary: "#A07868", accent: "#7A3020", accentSecondary: "#A04030", stampActive: "#7A3020", stampActiveIcon: "#F5E8E4", stampInactive: "#DEC8BC", border: "#D4C0B4", borderStrong: "#B4A094", qrBackground: "#FFFFFF", qrForeground: "#180C0A", rewardBackground: "#ECD8D0" } },
  { id: "navy-linen", name: "Navy / Linen", tokens: { background: "#F2EEE6", surface: "#E4DED2", surfaceSecondary: "#D4CEBC", text: "#080E1A", textSecondary: "#1A2848", textTertiary: "#7888A8", accent: "#1A2848", accentSecondary: "#2A3860", stampActive: "#1A2848", stampActiveIcon: "#F2EEE6", stampInactive: "#D4CEBC", border: "#C8C4B0", borderStrong: "#A8A48C", qrBackground: "#FFFFFF", qrForeground: "#080E1A", rewardBackground: "#E4DED2" } },
];

const template: CardTemplate = {
  id: "34-thread", name: "THREAD", subtitle: "Haute Couture",
  description: "Points de broderie, lignes fines cousues, élégance artisanale textile.",
  categories: ["luxury", "beauty", "editorial"],
  palettes, defaultPaletteId: "ivory-sage",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dotCount = 8;
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Liseret brodé en haut */}
        <svg style={{ position: "absolute", top: 0, left: 0, right: 0, width: "100%" }} height={thumbnail ? 6 : 11} viewBox="0 0 375 11" preserveAspectRatio="none">
          {Array.from({ length: dotCount }).map((_, i) => (
            <circle key={i} cx={24 + i * 47} cy="5.5" r={thumbnail ? 1.5 : 2.5} fill={tokens.accent} opacity="0.5"/>
          ))}
          <line x1="0" y1="5.5" x2="375" y2="5.5" stroke={tokens.accent} strokeWidth="0.5" strokeOpacity="0.25" strokeDasharray="4 6"/>
        </svg>
        {/* Liseret brodé en bas */}
        <svg style={{ position: "absolute", bottom: 0, left: 0, right: 0, width: "100%" }} height={thumbnail ? 6 : 11} viewBox="0 0 375 11" preserveAspectRatio="none">
          {Array.from({ length: dotCount }).map((_, i) => (
            <circle key={i} cx={24 + i * 47} cy="5.5" r={thumbnail ? 1.5 : 2.5} fill={tokens.accent} opacity="0.5"/>
          ))}
          <line x1="0" y1="5.5" x2="375" y2="5.5" stroke={tokens.accent} strokeWidth="0.5" strokeOpacity="0.25" strokeDasharray="4 6"/>
        </svg>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "8% 8%" : "10% 9%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.18em", color: tokens.textTertiary, marginBottom: 2 }}>FIDÉLITÉ</div>
              <div style={{ fontSize: thumbnail ? 8 : 12, fontWeight: 300, color: tokens.text, letterSpacing: "0.02em" }}>{data.nom || "Thread"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
            </div>
            <div style={{ fontSize: thumbnail ? 3 : 5, letterSpacing: "0.15em", color: tokens.textTertiary }}>WALLIO</div>
          </div>

          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="dot" tokens={tokens} size={thumbnail ? 9 : 16} gap={thumbnail ? 4 : 7} perRow={9}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 5 : 7, fontWeight: 300, color: tokens.textSecondary, letterSpacing: "0.04em" }}>{data.nom_recompense} · {filled}/{data.objectif_tampons}</div>
            
          </div>
        </div>
      </div>
    );
  },
};
export default template;
