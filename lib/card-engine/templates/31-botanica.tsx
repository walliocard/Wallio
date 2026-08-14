import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "forest-cream", name: "Forest / Cream", tokens: { background: "#F2EEE4", surface: "#E4DED0", surfaceSecondary: "#D4CEBC", text: "#0E1A0A", textSecondary: "#2A4020", textTertiary: "#7A9070", accent: "#224418", accentSecondary: "#3A6828", stampActive: "#224418", stampActiveIcon: "#F2EEE4", stampInactive: "#D4CEBC", border: "#C4C0A8", borderStrong: "#A4A088", qrBackground: "#FFFFFF", qrForeground: "#0E1A0A", rewardBackground: "#E4DED0" } },
  { id: "black-gold", name: "Black / Gold", tokens: { background: "#0A0A08", surface: "#181610", surfaceSecondary: "#242018", text: "#F0E8C0", textSecondary: "#C0A030", textTertiary: "#605010", accent: "#C0A030", accentSecondary: "#E0C050", stampActive: "#C0A030", stampActiveIcon: "#0A0A08", stampInactive: "#242018", border: "#2A2410", borderStrong: "#403800", qrBackground: "#F0E8C0", qrForeground: "#0A0A08", rewardBackground: "#181610" } },
  { id: "olive-sand", name: "Olive / Sand", tokens: { background: "#E8E4CC", surface: "#D8D4B8", surfaceSecondary: "#C8C4A0", text: "#141208", textSecondary: "#484020", textTertiary: "#888060", accent: "#586020", accentSecondary: "#788030", stampActive: "#586020", stampActiveIcon: "#E8E4CC", stampInactive: "#C8C4A0", border: "#B8B490", borderStrong: "#989470", qrBackground: "#FFFFFF", qrForeground: "#141208", rewardBackground: "#D8D4B8" } },
];

const template: CardTemplate = {
  id: "31-botanica", name: "BOTANICA", subtitle: "Luxury Botanical",
  description: "Feuilles très fines, ornements symétriques, serif élégante.",
  categories: ["nature", "luxury", "beauty"],
  palettes, defaultPaletteId: "forest-cream",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "Georgia, serif", position: "relative", overflow: "hidden" }}>
        {/* Ornement botanique SVG */}
        <svg style={{ position: "absolute", right: thumbnail ? "2%" : "3%", top: "50%", transform: "translateY(-50%)", opacity: 0.12 }} width={thumbnail ? 35 : 65} height={thumbnail ? 90 : 170} viewBox="0 0 65 170" fill="none">
          <line x1="32" y1="0" x2="32" y2="170" stroke={tokens.accent} strokeWidth="1"/>
          <path d="M32 30 C10 20 5 40 15 50 C25 60 32 50 32 50" fill={tokens.accent}/>
          <path d="M32 30 C54 20 59 40 49 50 C39 60 32 50 32 50" fill={tokens.accent}/>
          <path d="M32 70 C10 60 5 80 15 90 C25 100 32 90 32 90" fill={tokens.accent}/>
          <path d="M32 70 C54 60 59 80 49 90 C39 100 32 90 32 90" fill={tokens.accent}/>
          <path d="M32 110 C18 100 15 118 22 125 C29 132 32 125 32 125" fill={tokens.accent}/>
          <path d="M32 110 C46 100 49 118 42 125 C35 132 32 125 32 125" fill={tokens.accent}/>
        </svg>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: thumbnail ? 7 : 11, fontStyle: "italic", fontWeight: 600, color: tokens.text }}>{data.nom || "Botanica"}</div>
            {data.slogan && !thumbnail && <div style={{ fontSize: 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 3 }}>
              <div style={{ height: "0.5px", width: thumbnail ? 10 : 18, background: tokens.accent, opacity: 0.5 }}/>
              <div style={{ width: 3, height: 3, borderRadius: "50%", background: tokens.accent, opacity: 0.6 }}/>
              <div style={{ height: "0.5px", width: thumbnail ? 10 : 18, background: tokens.accent, opacity: 0.5 }}/>
            </div>
          </div>

          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="star" tokens={tokens} size={thumbnail ? 9 : 16} gap={thumbnail ? 3 : 5} perRow={9}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 5 : 7, color: tokens.textTertiary, fontStyle: "italic" }}>{data.nom_recompense} · {filled}/{data.objectif_tampons}</div>
            
          </div>
        </div>
      </div>
    );
  },
};
export default template;
