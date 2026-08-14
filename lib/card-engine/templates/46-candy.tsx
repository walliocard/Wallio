import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "pink-lavender", name: "Pink / Lavender", tokens: { background: "#FFE8F4", surface: "#FFD0EC", surfaceSecondary: "#FFB8E4", text: "#2A0820", textSecondary: "#8020A0", textTertiary: "#C080D0", accent: "#E030B0", accentSecondary: "#A030C8", stampActive: "#E030B0", stampActiveIcon: "#FFFFFF", stampInactive: "#FFB8E4", border: "#F0C0E8", borderStrong: "#D8A0D0", qrBackground: "#FFFFFF", qrForeground: "#2A0820", rewardBackground: "#FFD0EC" } },
  { id: "peach-mint", name: "Peach / Mint", tokens: { background: "#FFF0E8", surface: "#FFE0D0", surfaceSecondary: "#FFD0B8", text: "#1A0A08", textSecondary: "#208060", textTertiary: "#70B090", accent: "#10A878", accentSecondary: "#20D0A0", stampActive: "#10A878", stampActiveIcon: "#FFFFFF", stampInactive: "#FFD0B8", border: "#F0C8B8", borderStrong: "#D8A890", qrBackground: "#FFFFFF", qrForeground: "#1A0A08", rewardBackground: "#FFE0D0" } },
  { id: "blue-lilac", name: "Blue / Lilac", tokens: { background: "#EEF0FF", surface: "#DDE0FF", surfaceSecondary: "#CCD0FF", text: "#0A0C28", textSecondary: "#4040C0", textTertiary: "#8080D0", accent: "#4848E0", accentSecondary: "#8080FF", stampActive: "#4848E0", stampActiveIcon: "#FFFFFF", stampInactive: "#CCD0FF", border: "#C8D0F8", borderStrong: "#A8B0E8", qrBackground: "#FFFFFF", qrForeground: "#0A0C28", rewardBackground: "#DDE0FF" } },
];

const template: CardTemplate = {
  id: "46-candy", name: "CANDY", subtitle: "Soft Playful",
  description: "Pastels doux, formes rondes, typographie bubbly, bonbons.",
  categories: ["colorful", "beauty", "modern"],
  palettes, defaultPaletteId: "pink-lavender",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "-apple-system, 'Helvetica Neue', sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Circles décoratifs */}
        {[
          { x: "80%", y: "-5%", r: thumbnail ? 20 : 38, c: tokens.surface },
          { x: "10%", y: "80%", r: thumbnail ? 14 : 28, c: tokens.surfaceSecondary },
          { x: "60%", y: "85%", r: thumbnail ? 10 : 20, c: tokens.surface },
        ].map((c, i) => (
          <div key={i} style={{ position: "absolute", left: c.x, top: c.y, width: c.r * 2, height: c.r * 2, borderRadius: "50%", background: c.c, transform: "translate(-50%,-50%)" }}/>
        ))}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "7% 8%" : "8% 9%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><span style={{ fontSize: thumbnail ? 8 : 13, fontWeight: 700, color: tokens.text }}>{data.nom || "Candy"}</span>
            {data.slogan && !thumbnail && <div style={{ fontSize: 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400 }}>{data.slogan}</div>}</div>
            <div style={{ background: tokens.accent, borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 9px" }}>
              <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 600, color: "#fff" }}>WALLIO</span>
            </div>
          </div>

          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="circle" tokens={tokens} size={thumbnail ? 10 : 18} gap={thumbnail ? 3 : 5} perRow={9}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ background: tokens.surface, borderRadius: 20, padding: thumbnail ? "3px 8px" : "4px 14px" }}>
              <span style={{ fontSize: thumbnail ? 5 : 8, color: tokens.accent, fontWeight: 600 }}>{data.nom_recompense} 🍬</span>
            </div>
            {!thumbnail && <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: 12, padding: 4 }}><QRBox size={28} bg="#fff" fg={tokens.text} radius={6}/></div>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
