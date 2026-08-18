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
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 16 : (dims?.logoSize ?? 28);
    const fmtV = dims?.format === "compact" ? 0.68 : dims?.format === "wide" ? 0.52 : 1;

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Cercles argile — nature opacity 0.1 */}
        {[
          { x: "82%", y: "14%", r: thumbnail ? 20 : 38 },
          { x: "14%", y: "76%", r: thumbnail ? 14 : 26 },
        ].map((c, i) => (
          <div key={i} style={{ position: "absolute", left: c.x, top: c.y, width: c.r * 2, height: c.r * 2, borderRadius: "50%", border: `1.5px solid ${tokens.accent}`, opacity: 0.12, transform: "translate(-50%,-50%)" }}/>
        ))}

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: thumbnail ? "6% 7% 3%" : `${7*fmtV}% 8% ${4*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: logoSz, height: logoSz, borderRadius: "50%", objectFit: "cover" }}/>
            ) : (
              <div style={{ width: logoSz, height: logoSz, borderRadius: "50%", background: `${tokens.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.accent }}>{(data.nom[0] || "W").toUpperCase()}</span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 600, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>{data.nom || "Établissement"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: rs(8), color: `${tokens.text}80`, marginTop: 2 }}>{data.slogan}</div>}
            </div>
          </div>
          <div style={{ background: `${tokens.accent}20`, backdropFilter: "blur(8px)", borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px", border: `1px solid ${tokens.accent}35`, flexShrink: 0 }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style={(dims?.stampStyle ?? "rounded")} tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}/>
        </div>

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: `${tokens.text}70`, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>{data.nom_recompense}</div>
          </div>
          <div style={{ background: `${tokens.accent}20`, backdropFilter: "blur(8px)", borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px", border: `1px solid ${tokens.accent}30` }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, color: tokens.accent }}>{filled}/{data.objectif_tampons}</span>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
