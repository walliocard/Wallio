import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "sand-terracotta", name: "Sand / Terracotta", tokens: { background: "#F2E8D5", surface: "#E8D8C0", surfaceSecondary: "#D8C4A8", text: "#2A1A0E", textSecondary: "#7A4A2A", textTertiary: "#B08060", accent: "#C05A30", accentSecondary: "#E07A50", stampActive: "#C05A30", stampActiveIcon: "#F2E8D5", stampInactive: "#D8C4A8", border: "#D0BC98", borderStrong: "#B8A080", qrBackground: "#FFFFFF", qrForeground: "#2A1A0E", rewardBackground: "#E8D8C0" } },
  { id: "cream-deep-blue", name: "Cream / Deep Blue", tokens: { background: "#F5F0E8", surface: "#E8E0D0", surfaceSecondary: "#D8D0BC", text: "#0E1E3A", textSecondary: "#2A3E6A", textTertiary: "#7A8EAA", accent: "#1A2E5A", accentSecondary: "#2A4E8A", stampActive: "#1A2E5A", stampActiveIcon: "#F5F0E8", stampInactive: "#D8D0BC", border: "#C8C0A8", borderStrong: "#A8A088", qrBackground: "#FFFFFF", qrForeground: "#0E1E3A", rewardBackground: "#E8E0D0" } },
  { id: "olive-clay", name: "Olive / Clay", tokens: { background: "#EAE8DC", surface: "#D8D4C4", surfaceSecondary: "#C4BEA8", text: "#1A1C0E", textSecondary: "#4A4E2A", textTertiary: "#8A8E6A", accent: "#6A6A30", accentSecondary: "#9A9A50", stampActive: "#6A6A30", stampActiveIcon: "#EAE8DC", stampInactive: "#C4BEA8", border: "#C0BC98", borderStrong: "#A0A070", qrBackground: "#FFFFFF", qrForeground: "#1A1C0E", rewardBackground: "#D8D4C4" } },
];

const template: CardTemplate = {
  id: "05-atlas", name: "ATLAS", subtitle: "Mediterranean Contemporary",
  description: "Arches, formes architecturales, chaleur méditerranéenne.",
  categories: ["restaurant", "premium", "artistic"],
  palettes, defaultPaletteId: "sand-terracotta",
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
        {/* Grande arche décorative — très subtile */}
        <svg style={{ position: "absolute", right: 0, top: 0, height: "100%", width: thumbnail ? "35%" : "40%", opacity: 0.1 }} viewBox="0 0 150 246" preserveAspectRatio="none">
          <path d="M150 0 L50 0 A80 120 0 0 0 50 240 L150 240 Z" fill={tokens.accent}/>
          <path d="M150 20 L70 20 A60 100 0 0 0 70 220 L150 220 Z" fill={tokens.background}/>
        </svg>

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "6% 7% 3%" : `${7*fmtV}% 8% ${4*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{
                width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: thumbnail ? 5 : 8,
                background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.stampActiveIcon }}>
                  {(data.nom[0] || "W").toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 600, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>
                {data.nom || "Établissement"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2, fontStyle: "italic" }}>
                  {data.slogan}
                </div>
              )}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}18`, backdropFilter: "blur(8px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: `1px solid ${tokens.accent}25`, flexShrink: 0,
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS — dots méditerranéens */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style="dot" tokens={tokens}
            size={thumbnail ? 7 : 14} gap={thumbnail ? 3 : 6} perRow={9}
          />
        </div>

        {/* FOOTER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
              Récompense
            </div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}15`, backdropFilter: "blur(8px)",
            borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: `1px solid ${tokens.accent}20`,
          }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, color: tokens.accent }}>
              {filled}/{data.objectif_tampons}
            </span>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
