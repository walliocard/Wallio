import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "sage-cream", name: "Sage / Cream", tokens: { background: "#EBF0E8", surface: "#D8E2D4", surfaceSecondary: "#C4D2BE", text: "#1A2818", textSecondary: "#3A5030", textTertiary: "#7A9070", accent: "#4A7A50", accentSecondary: "#72A878", stampActive: "#4A7A50", stampActiveIcon: "#EBF0E8", stampInactive: "#C4D2BE", border: "#C0CDB8", borderStrong: "#9AAD90", qrBackground: "#FFFFFF", qrForeground: "#1A2818", rewardBackground: "#D8E2D4" } },
  { id: "terracotta-sand", name: "Terracotta / Sand", tokens: { background: "#F2EAE0", surface: "#E4D4C0", surfaceSecondary: "#D0BC9E", text: "#2A1408", textSecondary: "#6A3820", textTertiary: "#AA7850", accent: "#A0502A", accentSecondary: "#C87050", stampActive: "#A0502A", stampActiveIcon: "#F2EAE0", stampInactive: "#D0BC9E", border: "#C8B090", borderStrong: "#A89070", qrBackground: "#FFFFFF", qrForeground: "#2A1408", rewardBackground: "#E4D4C0" } },
  { id: "dusty-pink-forest", name: "Dusty Pink / Forest", tokens: { background: "#F5EAE8", surface: "#E8D4D0", surfaceSecondary: "#D8BEB8", text: "#1E0E0C", textSecondary: "#5A2820", textTertiary: "#9A6860", accent: "#7A3040", accentSecondary: "#A04860", stampActive: "#7A3040", stampActiveIcon: "#F5EAE8", stampInactive: "#D8BEB8", border: "#D0B8B0", borderStrong: "#B09090", qrBackground: "#FFFFFF", qrForeground: "#1E0E0C", rewardBackground: "#E8D4D0" } },
];

const template: CardTemplate = {
  id: "07-bloom", name: "BLOOM", subtitle: "Botanical",
  description: "Univers botanique, feuilles SVG, formes organiques douces.",
  categories: ["nature", "beauty", "minimal"],
  palettes, defaultPaletteId: "sage-cream",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "Georgia, serif", position: "relative", overflow: "hidden" }}>
        {/* Feuilles décoratives */}
        <svg style={{ position: "absolute", right: thumbnail ? "-5%" : "-8%", top: thumbnail ? "-10%" : "-15%", opacity: 0.15 }} width={thumbnail ? 60 : 110} height={thumbnail ? 80 : 150} viewBox="0 0 110 150" fill="none">
          <path d="M55 10 C30 30 10 70 30 110 C50 150 80 130 90 90 C100 50 80 10 55 10Z" fill={tokens.accent}/>
          <path d="M55 10 C55 10 55 80 30 110" stroke={tokens.background} strokeWidth="1.5"/>
          <path d="M75 40 C70 60 45 70 30 110" stroke={tokens.background} strokeWidth="1" opacity="0.6"/>
        </svg>
        <svg style={{ position: "absolute", left: thumbnail ? "-3%" : "-5%", bottom: thumbnail ? "5%" : "8%", opacity: 0.1 }} width={thumbnail ? 40 : 70} height={thumbnail ? 55 : 100} viewBox="0 0 70 100" fill="none">
          <path d="M35 5 C15 25 5 55 20 80 C35 100 55 85 60 60 C65 35 50 5 35 5Z" fill={tokens.accentSecondary}/>
          <path d="M35 5 C35 5 35 55 20 80" stroke={tokens.background} strokeWidth="1.2"/>
        </svg>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "7% 8%" : "8% 9%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 8 : 13, fontStyle: "italic", color: tokens.text, fontWeight: 400 }}>{data.nom || "Bloom"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: 8, color: tokens.textTertiary, marginTop: 2 }}>{data.slogan}</div>}
            </div>
            <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.15em", color: tokens.textTertiary }}>WALLIO</div>
          </div>

          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="star" tokens={tokens} size={thumbnail ? 9 : 16} gap={thumbnail ? 3 : 5} perRow={9}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textSecondary, fontStyle: "italic" }}>{data.nom_recompense} · {filled}/{data.objectif_tampons}</div>
            {!thumbnail && <div style={{ background: tokens.surface, borderRadius: 12, padding: 3 }}><QRBox size={30} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={8}/></div>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
