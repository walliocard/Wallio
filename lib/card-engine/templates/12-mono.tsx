import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "white-black", name: "White / Black", tokens: { background: "#FFFFFF", surface: "#F0F0F0", surfaceSecondary: "#E0E0E0", text: "#000000", textSecondary: "#404040", textTertiary: "#909090", accent: "#000000", accentSecondary: "#404040", stampActive: "#000000", stampActiveIcon: "#FFFFFF", stampInactive: "#E0E0E0", border: "#D0D0D0", borderStrong: "#A0A0A0", qrBackground: "#FFFFFF", qrForeground: "#000000", rewardBackground: "#F0F0F0" } },
  { id: "black-white", name: "Black / White", tokens: { background: "#000000", surface: "#141414", surfaceSecondary: "#282828", text: "#FFFFFF", textSecondary: "#C0C0C0", textTertiary: "#606060", accent: "#FFFFFF", accentSecondary: "#C0C0C0", stampActive: "#FFFFFF", stampActiveIcon: "#000000", stampInactive: "#282828", border: "#303030", borderStrong: "#484848", qrBackground: "#FFFFFF", qrForeground: "#000000", rewardBackground: "#141414" } },
  { id: "warm-charcoal", name: "Warm White / Charcoal", tokens: { background: "#F8F5F0", surface: "#EAE6E0", surfaceSecondary: "#D8D4CC", text: "#1A1614", textSecondary: "#3E3A34", textTertiary: "#8A8680", accent: "#1A1614", accentSecondary: "#3E3A34", stampActive: "#1A1614", stampActiveIcon: "#F8F5F0", stampInactive: "#D8D4CC", border: "#C8C4BC", borderStrong: "#A8A49C", qrBackground: "#FFFFFF", qrForeground: "#1A1614", rewardBackground: "#EAE6E0" } },
];

const template: CardTemplate = {
  id: "12-mono", name: "MONO", subtitle: "Ultra Monochrome",
  description: "Noir et blanc absolu. Sophistication extrême, aucune couleur.",
  categories: ["minimal", "luxury", "editorial"],
  palettes, defaultPaletteId: "white-black",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 16 : (dims?.logoSize ?? 28);

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Grande typographie fond — très subtile */}
        <div style={{
          position: "absolute", right: thumbnail ? "-2%" : "-3%", bottom: thumbnail ? "-5%" : "-8%",
          fontSize: thumbnail ? 50 : 90, fontWeight: 900, color: tokens.surface, lineHeight: 1,
          userSelect: "none", letterSpacing: -5, pointerEvents: "none",
        }}>
          {data.objectif_tampons}
        </div>

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "7% 8% 3%" : "8% 9% 4%",
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{
                width: thumbnail ? 16 : 28, height: thumbnail ? 16 : 28, borderRadius: thumbnail ? 5 : 8,
                background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.stampActiveIcon }}>
                  {(data.nom[0] || "W").toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 700, color: tokens.text, letterSpacing: -0.3, textTransform: "uppercase", lineHeight: 1.2 }}>
                {data.nom || "MONO"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>
                  {data.slogan}
                </div>
              )}
            </div>
          </div>
          {/* Badge WALLIO pill */}
          <div style={{
            background: `${tokens.accent}10`, backdropFilter: "blur(8px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: `1px solid ${tokens.accent}20`, flexShrink: 0,
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* Ligne fine séparation */}
        <div style={{ height: "0.5px", background: tokens.border, margin: thumbnail ? "0 8%" : "0 9%", opacity: 0.6 }}/>

        {/* TAMPONS — carrés monochromes */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 8%" : "0 9%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style="square" tokens={tokens}
            size={thumbnail ? 8 : 16} gap={thumbnail ? 2 : 4} perRow={9}
          />
        </div>

        {/* Ligne fine séparation */}
        <div style={{ height: "0.5px", background: tokens.border, margin: thumbnail ? "0 8%" : "0 9%", opacity: 0.6 }}/>

        {/* FOOTER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: thumbnail ? "3% 8% 7%" : "4% 9% 8%",
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
            background: `${tokens.accent}10`,
            borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: `1px solid ${tokens.accent}20`,
          }}>
            <span style={{ fontSize: thumbnail ? 6 : 11, fontWeight: 700, color: tokens.accent }}>
              {filled}/{data.objectif_tampons}
            </span>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
