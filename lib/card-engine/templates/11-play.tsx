import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "pastel", name: "Pastel", tokens: { background: "#FFF0F8", surface: "#FFE0F0", surfaceSecondary: "#FFD0E8", text: "#2A0A20", textSecondary: "#8A2060", textTertiary: "#C080A0", accent: "#E040A0", accentSecondary: "#FF80C0", stampActive: "#E040A0", stampActiveIcon: "#FFFFFF", stampInactive: "#FFD0E8", border: "#F0B0D0", borderStrong: "#D890B0", qrBackground: "#FFFFFF", qrForeground: "#2A0A20", rewardBackground: "#FFE0F0" } },
  { id: "primary", name: "Primary", tokens: { background: "#FFF8E0", surface: "#FFF0C0", surfaceSecondary: "#FFE8A0", text: "#0A1A40", textSecondary: "#0A4090", textTertiary: "#6080B0", accent: "#E02020", accentSecondary: "#0060E0", stampActive: "#0060E0", stampActiveIcon: "#FFFFFF", stampInactive: "#FFE8A0", border: "#F0D880", borderStrong: "#D0B840", qrBackground: "#FFFFFF", qrForeground: "#0A1A40", rewardBackground: "#FFF0C0" } },
  { id: "candy", name: "Candy", tokens: { background: "#F0F8FF", surface: "#E0F0FF", surfaceSecondary: "#D0E8FF", text: "#0A1428", textSecondary: "#4060A0", textTertiary: "#8090C0", accent: "#FF4080", accentSecondary: "#8040FF", stampActive: "#FF4080", stampActiveIcon: "#FFFFFF", stampInactive: "#D0E8FF", border: "#C0D8F0", borderStrong: "#A0C0E0", qrBackground: "#FFFFFF", qrForeground: "#0A1428", rewardBackground: "#E0F0FF" } },
];

const template: CardTemplate = {
  id: "11-play", name: "PLAY", subtitle: "Playful",
  description: "Joyeux, formes flottantes, typographie arrondie, récompense très visible.",
  categories: ["colorful", "modern", "street"],
  palettes, defaultPaletteId: "pastel",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "'Helvetica Neue', Arial, sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Formes flottantes */}
        {[
          { size: thumbnail ? 20 : 38, x: "78%", y: "5%", bg: tokens.accent, opacity: 0.12 },
          { size: thumbnail ? 14 : 28, x: "5%", y: "55%", bg: tokens.accentSecondary, opacity: 0.1 },
          { size: thumbnail ? 10 : 18, x: "65%", y: "70%", bg: tokens.surface, opacity: 0.6 },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.size, height: s.size, borderRadius: "50%", background: s.bg, opacity: s.opacity }}/>
        ))}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><span style={{ fontSize: thumbnail ? 9 : 14, fontWeight: 800, color: tokens.text }}>{data.nom || "Play"}</span>
            {data.slogan && !thumbnail && <div style={{ fontSize: 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400 }}>{data.slogan}</div>}</div>
            <div style={{ background: tokens.accent, borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px" }}>
              <span style={{ fontSize: thumbnail ? 4 : 7, fontWeight: 700, color: "#fff" }}>WALLIO</span>
            </div>
          </div>

          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="circle" tokens={tokens} size={thumbnail ? 10 : 18} gap={thumbnail ? 3 : 5} perRow={9}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ background: tokens.surface, borderRadius: 12, padding: thumbnail ? "3px 8px" : "4px 12px" }}>
              <span style={{ fontSize: thumbnail ? 5 : 8, fontWeight: 700, color: tokens.accent }}>🎁 {data.nom_recompense}</span>
            </div>
            {!thumbnail && <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 10, padding: 3 }}><QRBox size={30} bg="#fff" fg={tokens.text} radius={6}/></div>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
