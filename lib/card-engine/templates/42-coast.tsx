import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "navy-sand", name: "Navy / Sand", tokens: { background: "#0A1E3A", surface: "#142840", surfaceSecondary: "#1E3450", text: "#F5EDD8", textSecondary: "#C0A870", textTertiary: "#605838", accent: "#C0A870", accentSecondary: "#E0C890", stampActive: "#F5EDD8", stampActiveIcon: "#0A1E3A", stampInactive: "#1E3450", border: "#1E3050", borderStrong: "#2E4868", qrBackground: "#F5EDD8", qrForeground: "#0A1E3A", rewardBackground: "#142840" } },
  { id: "sky-cream", name: "Sky / Cream", tokens: { background: "#B8D8F0", surface: "#A0C8E8", surfaceSecondary: "#88B8E0", text: "#081828", textSecondary: "#1A4060", textTertiary: "#508090", accent: "#1040A0", accentSecondary: "#1860D0", stampActive: "#1040A0", stampActiveIcon: "#B8D8F0", stampInactive: "#88B8E0", border: "#98C0D8", borderStrong: "#78A8C8", qrBackground: "#FFFFFF", qrForeground: "#081828", rewardBackground: "#A0C8E8" } },
  { id: "teal-offwhite", name: "Teal / Off White", tokens: { background: "#1A4848", surface: "#224E4E", surfaceSecondary: "#2C5858", text: "#F0EFEA", textSecondary: "#C0D8D0", textTertiary: "#70988E", accent: "#80D0C0", accentSecondary: "#A0E8D8", stampActive: "#F0EFEA", stampActiveIcon: "#1A4848", stampInactive: "#2C5858", border: "#2C5858", borderStrong: "#406868", qrBackground: "#FFFFFF", qrForeground: "#1A4848", rewardBackground: "#224E4E" } },
];

const template: CardTemplate = {
  id: "42-coast", name: "COAST", subtitle: "Coastal",
  description: "Vagues abstraites, lignes fluides, palette côtière.",
  categories: ["nature", "restaurant", "minimal"],
  palettes, defaultPaletteId: "navy-sand",
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
        {/* Vagues SVG — nature opacity subtile */}
        <svg style={{ position: "absolute", bottom: 0, left: 0, right: 0, pointerEvents: "none" }} width="100%" height={thumbnail ? "38%" : "42%"} viewBox="0 0 375 110" preserveAspectRatio="none">
          <path d="M-10 110 C60 60 130 90 200 55 C270 20 320 70 385 40 L385 110 Z" fill={tokens.surface} fillOpacity="0.4"/>
          <path d="M-10 110 C80 75 160 100 240 70 C300 50 340 80 385 60 L385 110 Z" fill={tokens.surfaceSecondary} fillOpacity="0.3"/>
        </svg>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: thumbnail ? "6% 7% 3%" : "7% 8% 4%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 5 : 8, background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.stampActiveIcon }}>{(data.nom[0] || "W").toUpperCase()}</span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 600, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>{data.nom || "Établissement"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>{data.slogan}</div>}
            </div>
          </div>
          <div style={{ background: `${tokens.accent}18`, backdropFilter: "blur(8px)", borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px", border: `1px solid ${tokens.accent}25`, flexShrink: 0 }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style="circle" tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}/>
        </div>

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: thumbnail ? "3% 7% 6%" : "4% 8% 7%", position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>{data.nom_recompense}</div>
          </div>
          <div style={{ background: `${tokens.accent}15`, backdropFilter: "blur(8px)", borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px", border: `1px solid ${tokens.accent}20` }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, color: tokens.accent }}>{filled}/{data.objectif_tampons}</span>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
