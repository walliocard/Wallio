import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  {
    id: "ivory", name: "Ivory",
    tokens: {
      background: "#F8F7F4", surface: "#EEECEA", surfaceSecondary: "#E4E1DC",
      text: "#171717", textSecondary: "#5A5A5A", textTertiary: "#9A9A9A",
      accent: "#007AFF", accentSecondary: "#BF5AF2",
      stampActive: "#171717", stampActiveIcon: "#F8F7F4", stampInactive: "#DDDAD4",
      border: "#E0DDD8", borderStrong: "#C8C4BE",
      qrBackground: "#FFFFFF", qrForeground: "#171717",
      rewardBackground: "#EEECEA",
    },
  },
  {
    id: "graphite", name: "Graphite",
    tokens: {
      background: "#1C1C1E", surface: "#2C2C2E", surfaceSecondary: "#3A3A3C",
      text: "#FFFFFF", textSecondary: "#AEAEB2", textTertiary: "#636366",
      accent: "#BF5AF2", accentSecondary: "#007AFF",
      stampActive: "#FFFFFF", stampActiveIcon: "#1C1C1E", stampInactive: "#3A3A3C",
      border: "#3A3A3C", borderStrong: "#4A4A4C",
      qrBackground: "#FFFFFF", qrForeground: "#1C1C1E",
      rewardBackground: "#2C2C2E",
    },
  },
  {
    id: "sage", name: "Sage",
    tokens: {
      background: "#EEF3EF", surface: "#E0EAE1", surfaceSecondary: "#D0DFD1",
      text: "#1D2923", textSecondary: "#4A5E50", textTertiary: "#8A9E90",
      accent: "#2D6A4F", accentSecondary: "#52B788",
      stampActive: "#2D6A4F", stampActiveIcon: "#EEF3EF", stampInactive: "#C8D8CA",
      border: "#C8D8CA", borderStrong: "#A8C4AB",
      qrBackground: "#FFFFFF", qrForeground: "#1D2923",
      rewardBackground: "#E0EAE1",
    },
  },
];

const template: CardTemplate = {
  id: "01-aura",
  name: "AURA",
  subtitle: "Minimal Premium",
  description: "Ultra minimaliste, grands espaces, typographie sobre. Inspiré d'Apple.",
  categories: ["minimal", "premium", "modern"],
  palettes,
  defaultPaletteId: "ivory",
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
        {/* Élément décoratif — ligne fine opacity très subtile */}
        <div style={{
          position: "absolute", bottom: "30%", left: "7%", right: "7%",
          height: "0.5px", background: tokens.border, opacity: 0.5,
        }}/>

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
          {/* Badge WALLIO pill */}
          <div style={{
            background: `${tokens.accent}18`, backdropFilter: "blur(8px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: `1px solid ${tokens.accent}25`, flexShrink: 0,
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style="circle" tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}
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
