import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "yellow-terracotta", name: "Yellow / Terracotta", tokens: { background: "#F5D840", surface: "#E8C830", surfaceSecondary: "#D8B820", text: "#1A0A04", textSecondary: "#6A2C10", textTertiary: "#A06030", accent: "#C04820", accentSecondary: "#E06030", stampActive: "#C04820", stampActiveIcon: "#F5D840", stampInactive: "#D8B820", border: "#C8A810", borderStrong: "#A08800", qrBackground: "#FFFFFF", qrForeground: "#1A0A04", rewardBackground: "#E8C830" } },
  { id: "blue-sand", name: "Blue / Sand", tokens: { background: "#1840A0", surface: "#102E80", surfaceSecondary: "#0C2060", text: "#F5EDD0", textSecondary: "#E0C880", textTertiary: "#806840", accent: "#F5D840", accentSecondary: "#F0E060", stampActive: "#F5D840", stampActiveIcon: "#1840A0", stampInactive: "#0C2060", border: "#1A2E68", borderStrong: "#2A4090", qrBackground: "#FFFFFF", qrForeground: "#1840A0", rewardBackground: "#102E80" } },
  { id: "olive-cream", name: "Olive / Cream", tokens: { background: "#8A9040", surface: "#787E30", surfaceSecondary: "#686C20", text: "#F8F2DC", textSecondary: "#E8D880", textTertiary: "#B0A040", accent: "#F8D840", accentSecondary: "#F0E860", stampActive: "#F8F2DC", stampActiveIcon: "#8A9040", stampInactive: "#686C20", border: "#787E30", borderStrong: "#606620", qrBackground: "#FFFFFF", qrForeground: "#8A9040", rewardBackground: "#787E30" } },
];

const template: CardTemplate = {
  id: "41-sun", name: "SUN", subtitle: "Mediterranean",
  description: "Soleil, cercles rayonnants, couleurs chaudes méditerranéennes.",
  categories: ["restaurant", "colorful", "nature"],
  palettes, defaultPaletteId: "yellow-terracotta",
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
        {/* Soleil SVG — nature opacity 0.12 */}
        <svg style={{ position: "absolute", right: thumbnail ? "-5%" : "-8%", top: "50%", transform: "translateY(-50%)", opacity: 0.12, pointerEvents: "none" }} width={thumbnail ? 60 : 110} height={thumbnail ? 60 : 110} viewBox="0 0 110 110" fill="none">
          <circle cx="55" cy="55" r="25" fill={tokens.accent}/>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45) * Math.PI / 180;
            const x1 = 55 + 30 * Math.cos(angle); const y1 = 55 + 30 * Math.sin(angle);
            const x2 = 55 + 48 * Math.cos(angle); const y2 = 55 + 48 * Math.sin(angle);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tokens.accent} strokeWidth="3" strokeLinecap="round"/>;
          })}
        </svg>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: thumbnail ? "6% 7% 3%" : `${7*fmtV}% 8% ${4*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 5 : 8, background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.stampActiveIcon }}>{(data.nom[0] || "W").toUpperCase()}</span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 700, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>{data.nom || "Établissement"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>{data.slogan}</div>}
            </div>
          </div>
          <div style={{ background: `${tokens.accent}25`, backdropFilter: "blur(8px)", borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px", border: `1px solid ${tokens.accent}40`, flexShrink: 0 }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style={(dims?.stampStyle ?? "star")} tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}/>
        </div>

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>{data.nom_recompense}</div>
          </div>
          <div style={{ background: `${tokens.accent}20`, backdropFilter: "blur(8px)", borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px", border: `1px solid ${tokens.accent}35` }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, color: tokens.accent }}>{filled}/{data.objectif_tampons}</span>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
