import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "purple-lime", name: "Purple / Lime", tokens: { background: "#1A0830", surface: "#2E1050", surfaceSecondary: "#3E1870", text: "#FFFFFF", textSecondary: "#C0FF40", textTertiary: "#8060A0", accent: "#C0FF40", accentSecondary: "#A8E030", stampActive: "#C0FF40", stampActiveIcon: "#1A0830", stampInactive: "#3E1870", border: "#4A2080", borderStrong: "#6030A0", qrBackground: "#FFFFFF", qrForeground: "#1A0830", rewardBackground: "#2E1050" } },
  { id: "blue-orange", name: "Blue / Orange", tokens: { background: "#0A0E28", surface: "#141A40", surfaceSecondary: "#1E2858", text: "#FFFFFF", textSecondary: "#FF8020", textTertiary: "#405080", accent: "#FF8020", accentSecondary: "#FFA040", stampActive: "#FF8020", stampActiveIcon: "#0A0E28", stampInactive: "#1E2858", border: "#283060", borderStrong: "#3840A0", qrBackground: "#FFFFFF", qrForeground: "#0A0E28", rewardBackground: "#141A40" } },
  { id: "pink-red", name: "Pink / Red", tokens: { background: "#20080E", surface: "#340C16", surfaceSecondary: "#481020", text: "#FFFFFF", textSecondary: "#FF60A0", textTertiary: "#601830", accent: "#FF60A0", accentSecondary: "#FF3060", stampActive: "#FF60A0", stampActiveIcon: "#20080E", stampInactive: "#481020", border: "#5A1428", borderStrong: "#801C38", qrBackground: "#FFFFFF", qrForeground: "#20080E", rewardBackground: "#340C16" } },
];

const template: CardTemplate = {
  id: "10-club90", name: "CLUB 90", subtitle: "90s Retro",
  description: "Années 90, typographie bold, géométries colorées, étoiles.",
  categories: ["retro", "colorful", "street"],
  palettes, defaultPaletteId: "purple-lime",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "'Arial Black', 'Impact', sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Formes géométriques 90s */}
        <div style={{ position: "absolute", top: thumbnail ? -8 : -15, right: thumbnail ? -8 : -15, width: thumbnail ? 30 : 55, height: thumbnail ? 30 : 55, borderRadius: "50%", background: tokens.accent, opacity: 0.3 }}/>
        <div style={{ position: "absolute", bottom: thumbnail ? 15 : 30, left: thumbnail ? -5 : -10, width: thumbnail ? 20 : 40, height: thumbnail ? 20 : 40, background: tokens.accentSecondary, opacity: 0.2, transform: "rotate(45deg)" }}/>
        {/* Étoiles déco */}
        {!thumbnail && [{ x: "75%", y: "12%", s: 8 }, { x: "15%", y: "60%", s: 6 }].map((star, i) => (
          <div key={i} style={{ position: "absolute", left: star.x, top: star.y, fontSize: star.s, color: tokens.accent, opacity: 0.5 }}>★</div>
        ))}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: thumbnail ? 8 : 13, fontWeight: 900, color: tokens.text, textTransform: "uppercase", letterSpacing: 1 }}>{data.nom || "CLUB"}</span>
            <span style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textSecondary, letterSpacing: "0.1em" }}>★ WALLIO ★</span>
          </div>

          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="star" tokens={tokens} size={thumbnail ? 10 : 18} gap={thumbnail ? 3 : 5} perRow={9}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 8 : 14, fontWeight: 900, color: tokens.accent }}>{filled}<span style={{ color: tokens.textTertiary, fontSize: thumbnail ? 6 : 10 }}>/{data.objectif_tampons}</span></div>
              <div style={{ fontSize: thumbnail ? 5 : 7, color: tokens.textSecondary }}>{data.nom_recompense}</div>
            </div>
            {!thumbnail && <div style={{ background: "#FFFFFF", padding: 3, borderRadius: 4 }}><QRBox size={32} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={0}/></div>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
