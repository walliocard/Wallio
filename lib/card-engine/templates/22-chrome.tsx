import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "chrome-blue", name: "Chrome / Blue", tokens: { background: "#1A1E28", surface: "#252A38", surfaceSecondary: "#303748", text: "#D8DCE8", textSecondary: "#6080C0", textTertiary: "#384868", accent: "#4070E0", accentSecondary: "#60A0FF", stampActive: "#60A0FF", stampActiveIcon: "#1A1E28", stampInactive: "#303748", border: "#2A3050", borderStrong: "#404860", qrBackground: "#FFFFFF", qrForeground: "#1A1E28", rewardBackground: "#252A38" } },
  { id: "chrome-purple", name: "Chrome / Purple", tokens: { background: "#18141E", surface: "#221C2C", surfaceSecondary: "#2E2438", text: "#D8D0E8", textSecondary: "#8050C0", textTertiary: "#402860", accent: "#A060E0", accentSecondary: "#C080FF", stampActive: "#C080FF", stampActiveIcon: "#18141E", stampInactive: "#2E2438", border: "#302048", borderStrong: "#483060", qrBackground: "#FFFFFF", qrForeground: "#18141E", rewardBackground: "#221C2C" } },
  { id: "chrome-green", name: "Chrome / Green", tokens: { background: "#101814", surface: "#18241C", surfaceSecondary: "#203024", text: "#C8DCD0", textSecondary: "#30B870", textTertiary: "#185830", accent: "#20D060", accentSecondary: "#40F080", stampActive: "#40F080", stampActiveIcon: "#101814", stampInactive: "#203024", border: "#184030", borderStrong: "#286050", qrBackground: "#FFFFFF", qrForeground: "#101814", rewardBackground: "#18241C" } },
];

const template: CardTemplate = {
  id: "22-chrome", name: "CHROME", subtitle: "Futuristic",
  description: "Metal chromé, dégradés métalliques, anneaux comme tampons.",
  categories: ["modern", "premium", "street"],
  palettes, defaultPaletteId: "chrome-blue",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${tokens.background} 0%, ${tokens.surface} 50%, ${tokens.background} 100%)`, display: "flex", flexDirection: "column", fontFamily: "'Helvetica Neue', Arial, sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Reflet métallique */}
        <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: "1px", background: `linear-gradient(90deg, transparent, ${tokens.accentSecondary}40, transparent)` }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: thumbnail ? 8 : 12, fontWeight: 700, letterSpacing: 1, color: tokens.text, textTransform: "uppercase" }}>{data.nom || "CHROME"}</span>
              {data.slogan && !thumbnail && <div style={{ fontSize: 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
            </div>
            <div style={{ width: thumbnail ? 16 : 28, height: thumbnail ? 16 : 28, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%, ${tokens.accentSecondary}, ${tokens.accent})`, opacity: 0.9, flexShrink: 0 }}/>
          </div>

          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="ring" tokens={tokens} size={thumbnail ? 10 : 18} gap={thumbnail ? 3 : 5} perRow={9}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.15em", color: tokens.textTertiary }}>REWARD</div>
              <div style={{ fontSize: thumbnail ? 6 : 9, color: tokens.textSecondary }}>{data.nom_recompense}</div>
            </div>
            <div style={{ fontSize: thumbnail ? 6 : 9, fontWeight: 600, color: tokens.textSecondary }}>{filled}/{data.objectif_tampons}</div>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
