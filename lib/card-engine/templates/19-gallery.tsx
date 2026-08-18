import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "cream-black", name: "Cream / Black", tokens: { background: "#F8F5EE", surface: "#EDE8DC", surfaceSecondary: "#DED8C8", text: "#0A0A0A", textSecondary: "#3A3A3A", textTertiary: "#9A9A9A", accent: "#0A0A0A", accentSecondary: "#3A3A3A", stampActive: "#0A0A0A", stampActiveIcon: "#F8F5EE", stampInactive: "#DED8C8", border: "#C8C4BC", borderStrong: "#A8A49C", qrBackground: "#FFFFFF", qrForeground: "#0A0A0A", rewardBackground: "#EDE8DC" } },
  { id: "grey-cobalt", name: "Grey / Cobalt", tokens: { background: "#E8E8EC", surface: "#D8D8E0", surfaceSecondary: "#C8C8D4", text: "#0A0C20", textSecondary: "#2030A0", textTertiary: "#6070C0", accent: "#1428A0", accentSecondary: "#2040D0", stampActive: "#1428A0", stampActiveIcon: "#E8E8EC", stampInactive: "#C8C8D4", border: "#B8B8CC", borderStrong: "#9898B0", qrBackground: "#FFFFFF", qrForeground: "#0A0C20", rewardBackground: "#D8D8E0" } },
  { id: "black-white", name: "Black / White", tokens: { background: "#0A0A0A", surface: "#141414", surfaceSecondary: "#202020", text: "#FFFFFF", textSecondary: "#AAAAAA", textTertiary: "#555555", accent: "#FFFFFF", accentSecondary: "#AAAAAA", stampActive: "#FFFFFF", stampActiveIcon: "#0A0A0A", stampInactive: "#202020", border: "#282828", borderStrong: "#383838", qrBackground: "#FFFFFF", qrForeground: "#0A0A0A", rewardBackground: "#141414" } },
];

const template: CardTemplate = {
  id: "19-gallery", name: "GALLERY", subtitle: "Art Gallery",
  description: "Espaces vides immenses, élément graphique central, QR quasi caché.",
  categories: ["minimal", "artistic", "editorial"],
  palettes, defaultPaletteId: "cream-black",
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
        {/* Élément graphique central — cercles concentriques très subtils */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: thumbnail ? 50 : 300, height: thumbnail ? 50 : 300,
          borderRadius: "50%", border: `1px solid ${tokens.border}`, opacity: 0.4,
        }}/>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: thumbnail ? 25 : 45, height: thumbnail ? 25 : 45,
          borderRadius: "50%", background: tokens.border, opacity: 0.15,
        }}/>

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "7% 8% 3%" : `${8*fmtV}% 9% ${4*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : null}
            <div>
              <div style={{ fontSize: thumbnail ? 5 : ns(9), fontWeight: 600, letterSpacing: "0.1em", color: tokens.textTertiary, textTransform: "uppercase" }}>
                {(data.nom || "GALLERY").slice(0, 8)}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(7), color: tokens.textTertiary, marginTop: 2 }}>
                  {data.slogan}
                </div>
              )}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}10`, backdropFilter: "blur(8px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: `1px solid ${tokens.accent}18`, flexShrink: 0,
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* Espace gallery — vide intentionnel */}
        <div style={{ flex: 1 }}/>

        {/* TAMPONS + FOOTER */}
        <div style={{
          display: "flex", flexDirection: "column", gap: thumbnail ? 4 : 8,
          padding: thumbnail ? "3% 8% 7%" : `${4*fmtV}% 9% ${8*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          {/* Tampons dots minuscules */}
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style={(dims?.stampStyle ?? "dot")} tokens={tokens}
            size={thumbnail ? 5 : 10} gap={thumbnail ? 2 : 4} perRow={10}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary }}>
              {data.nom_recompense}
            </div>
            <div style={{
              background: `${tokens.accent}10`,
              borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
              border: `1px solid ${tokens.accent}18`,
            }}>
              <span style={{ fontSize: thumbnail ? 5 : ss(10), fontWeight: 600, color: tokens.accent }}>
                {filled}/{data.objectif_tampons}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
