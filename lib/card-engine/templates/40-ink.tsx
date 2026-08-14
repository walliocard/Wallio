import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";

const palettes: CardPalette[] = [
  { id: "ink-paper", name: "Ink / Paper", tokens: { background: "#F4F0E8", surface: "#E4E0D4", surfaceSecondary: "#D4D0C4", text: "#0A0804", textSecondary: "#3A3428", textTertiary: "#8A8478", accent: "#0A0804", accentSecondary: "#3A3428", stampActive: "#0A0804", stampActiveIcon: "#F4F0E8", stampInactive: "#D4D0C4", border: "#C4C0B4", borderStrong: "#A4A094", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#E4E0D4" } },
  { id: "ink-red", name: "Ink / Red", tokens: { background: "#0A0804", surface: "#141208", surfaceSecondary: "#1E1C10", text: "#F4F0E8", textSecondary: "#AA2020", textTertiary: "#503018", accent: "#CC2020", accentSecondary: "#EE3030", stampActive: "#CC2020", stampActiveIcon: "#0A0804", stampInactive: "#1E1C10", border: "#282010", borderStrong: "#3C3018", qrBackground: "#F4F0E8", qrForeground: "#0A0804", rewardBackground: "#141208" } },
  { id: "charcoal-sand", name: "Charcoal / Sand", tokens: { background: "#2A2820", surface: "#38362C", surfaceSecondary: "#484638", text: "#F0E8D0", textSecondary: "#C0B080", textTertiary: "#705840", accent: "#C0B080", accentSecondary: "#E0D0A0", stampActive: "#C0B080", stampActiveIcon: "#2A2820", stampInactive: "#484638", border: "#3A3828", borderStrong: "#504E38", qrBackground: "#F0E8D0", qrForeground: "#2A2820", rewardBackground: "#38362C" } },
];

const template: CardTemplate = {
  id: "40-ink", name: "INK", subtitle: "Japanese Ink",
  description: "Pinceau abstrait, espace vide, sceaux circulaires, encre japonaise.",
  categories: ["artistic", "minimal", "luxury"],
  palettes, defaultPaletteId: "ink-paper",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Trait de pinceau SVG en fond */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }} viewBox="0 0 375 246" preserveAspectRatio="none">
          <path d="M-20 80 C60 40 150 120 260 60 C320 30 370 90 400 70" stroke={tokens.text} strokeWidth="45" strokeLinecap="round" fill="none"/>
        </svg>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "7% 8%" : "8% 9%", position: "relative", zIndex: 1 }}>
          {/* Haut — nom + wallio */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: thumbnail ? 7 : 11, fontWeight: 300, color: tokens.text, letterSpacing: 2 }}>{data.nom || "INK"}</span>
            <span style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.15em", color: tokens.textTertiary }}>WALLIO</span>
          </div>

          {/* Centre — sceaux circulaires */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: thumbnail ? 3 : 6, alignItems: "center" }}>
            {Array.from({ length: data.objectif_tampons }).map((_, i) => {
              const on = i < filled;
              return (
                <div key={i} style={{ width: thumbnail ? 10 : 18, height: thumbnail ? 10 : 18, borderRadius: "50%", border: `1px solid ${on ? tokens.stampActive : tokens.border}`, background: on ? `${tokens.stampActive}20` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {on && <div style={{ width: thumbnail ? 4 : 8, height: thumbnail ? 4 : 8, borderRadius: "50%", background: tokens.stampActive }}/>}
                </div>
              );
            })}
          </div>

          {/* Bas */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 5 : 7, color: tokens.textTertiary, letterSpacing: 1 }}>{data.nom_recompense}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
              <div style={{ fontSize: thumbnail ? 6 : 9, fontWeight: 500, color: tokens.textSecondary }}>{filled}/{data.objectif_tampons}</div>
            </div>
            {!thumbnail && <QRBox size={28} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={0}/>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
