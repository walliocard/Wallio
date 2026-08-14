import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "nude-burgundy", name: "Nude / Burgundy", tokens: { background: "#F0E4DC", surface: "#E4D0C4", surfaceSecondary: "#D4BCA8", text: "#1A0808", textSecondary: "#6A1828", textTertiary: "#AA8878", accent: "#8A2038", accentSecondary: "#BA3050", stampActive: "#8A2038", stampActiveIcon: "#F0E4DC", stampInactive: "#D4BCA8", border: "#D0B8A8", borderStrong: "#B09888", qrBackground: "#FFFFFF", qrForeground: "#1A0808", rewardBackground: "#E4D0C4" } },
  { id: "blush-forest", name: "Blush / Forest", tokens: { background: "#F5EAE8", surface: "#EAD8D4", surfaceSecondary: "#DAC4C0", text: "#0E0808", textSecondary: "#2A4020", textTertiary: "#8A7878", accent: "#2A4E28", accentSecondary: "#3A6E38", stampActive: "#2A4E28", stampActiveIcon: "#F5EAE8", stampInactive: "#DAC4C0", border: "#D4C0BC", borderStrong: "#B4A0A0", qrBackground: "#FFFFFF", qrForeground: "#0E0808", rewardBackground: "#EAD8D4" } },
  { id: "cream-black", name: "Cream / Black", tokens: { background: "#F8F4EE", surface: "#EEE8DC", surfaceSecondary: "#DED8C8", text: "#0A0A0A", textSecondary: "#3A3A3A", textTertiary: "#9A9A9A", accent: "#0A0A0A", accentSecondary: "#3A3A3A", stampActive: "#0A0A0A", stampActiveIcon: "#F8F4EE", stampInactive: "#DED8C8", border: "#C8C4BC", borderStrong: "#A8A49C", qrBackground: "#FFFFFF", qrForeground: "#0A0A0A", rewardBackground: "#EEE8DC" } },
];

const template: CardTemplate = {
  id: "33-silk", name: "SILK", subtitle: "Beauty",
  description: "Institut, beauté, soie. Formes fluides, typographie fine, drops comme tampons.",
  categories: ["beauty", "luxury", "minimal"],
  palettes, defaultPaletteId: "nude-burgundy",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${tokens.background} 0%, ${tokens.surface} 100%)`, display: "flex", flexDirection: "column", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Forme fluide décorative */}
        <svg style={{ position: "absolute", right: thumbnail ? "-5%" : "-8%", bottom: thumbnail ? "10%" : "15%", opacity: 0.15 }} width={thumbnail ? 50 : 90} height={thumbnail ? 50 : 90} viewBox="0 0 90 90" fill="none">
          <path d="M45 5 C72 0 90 22 88 50 C86 78 62 90 38 87 C14 84 0 62 4 36 C8 10 18 10 45 5Z" fill={tokens.accent}/>
        </svg>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "7% 8%" : "8% 9%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.2em", color: tokens.textTertiary, marginBottom: 2 }}>BEAUTÉ & BIEN-ÊTRE</div>
              <div style={{ fontSize: thumbnail ? 8 : 13, fontWeight: 300, color: tokens.text, letterSpacing: 1 }}>{data.nom || "Silk"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
            </div>
            <div style={{ fontSize: thumbnail ? 3 : 5, letterSpacing: "0.15em", color: tokens.textTertiary }}>WALLIO</div>
          </div>

          {/* Tampons gouttes */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: thumbnail ? 3 : 6 }}>
            {Array.from({ length: data.objectif_tampons }).map((_, i) => {
              const on = i < filled;
              return (
                <div key={i} style={{ width: thumbnail ? 7 : 13, height: thumbnail ? 9 : 17, borderRadius: `${thumbnail ? 4 : 7}px ${thumbnail ? 4 : 7}px ${thumbnail ? 4 : 7}px 0`, background: on ? tokens.stampActive : tokens.stampInactive, transform: "rotate(-15deg)", flexShrink: 0 }}/>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, fontWeight: 300, letterSpacing: 0.5 }}>{data.nom_recompense} · {filled}/{data.objectif_tampons}</div>
            
          </div>
        </div>
      </div>
    );
  },
};
export default template;
