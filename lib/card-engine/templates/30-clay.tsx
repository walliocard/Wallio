import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "clay-cream", name: "Clay / Cream", tokens: { background: "#D8826A", surface: "#C07050", surfaceSecondary: "#A85E3A", text: "#FAF0E8", textSecondary: "#F0D8C0", textTertiary: "#C0A080", accent: "#FAF0E8", accentSecondary: "#F0D8C0", stampActive: "#FAF0E8", stampActiveIcon: "#D8826A", stampInactive: "#A85E3A", border: "#C07050", borderStrong: "#A85E3A", qrBackground: "#FAF0E8", qrForeground: "#D8826A", rewardBackground: "#C07050" } },
  { id: "olive-sand", name: "Olive / Sand", tokens: { background: "#7A8A50", surface: "#6A7840", surfaceSecondary: "#586530", text: "#FAF0DC", textSecondary: "#E0D098", textTertiary: "#B0A060", accent: "#FAF0DC", accentSecondary: "#E0D098", stampActive: "#FAF0DC", stampActiveIcon: "#7A8A50", stampInactive: "#586530", border: "#6A7840", borderStrong: "#586530", qrBackground: "#FAF0DC", qrForeground: "#7A8A50", rewardBackground: "#6A7840" } },
  { id: "terracotta-navy", name: "Terracotta / Navy", tokens: { background: "#C06040", surface: "#A85030", surfaceSecondary: "#904020", text: "#F5F0E8", textSecondary: "#A0C8E0", textTertiary: "#6090B0", accent: "#80B8D8", accentSecondary: "#A0D8F8", stampActive: "#F5F0E8", stampActiveIcon: "#C06040", stampInactive: "#904020", border: "#A85030", borderStrong: "#904020", qrBackground: "#FFFFFF", qrForeground: "#C06040", rewardBackground: "#A85030" } },
];

const template: CardTemplate = {
  id: "30-clay", name: "CLAY", subtitle: "Earthen",
  description: "Céramique, formes arrondies, textures douces, chaleur terreuse.",
  categories: ["nature", "restaurant", "coffee"],
  palettes, defaultPaletteId: "clay-cream",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "Georgia, serif", position: "relative", overflow: "hidden" }}>
        {/* Texture argile — cercles en fond */}
        {[
          { x: "80%", y: "15%", r: thumbnail ? 20 : 38 },
          { x: "15%", y: "75%", r: thumbnail ? 14 : 28 },
        ].map((c, i) => (
          <div key={i} style={{ position: "absolute", left: c.x, top: c.y, width: c.r * 2, height: c.r * 2, borderRadius: "50%", border: `1px solid ${tokens.accent}`, opacity: 0.2, transform: "translate(-50%,-50%)" }}/>
        ))}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "7% 8%" : "8% 9%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {data.logo_url && <img src={data.logo_url} alt="" style={{ width: thumbnail ? 14 : 22, height: thumbnail ? 14 : 22, borderRadius: "50%", objectFit: "cover", marginBottom: 3 }}/>}
              <div style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 600, color: tokens.text, fontStyle: "italic" }}>{data.nom || "Clay"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
            </div>
            <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.12em", color: tokens.textTertiary }}>WALLIO</div>
          </div>

          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="rounded" tokens={tokens} size={thumbnail ? 9 : 16} gap={thumbnail ? 3 : 5} perRow={9}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textSecondary, fontStyle: "italic" }}>{data.nom_recompense} · {filled}/{data.objectif_tampons}</div>
            {!thumbnail && <div style={{ background: "rgba(255,255,255,0.3)", borderRadius: 8, padding: 3 }}><QRBox size={30} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={4}/></div>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
