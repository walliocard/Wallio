import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "ink-cream", name: "Ink / Cream", tokens: { background: "#F0EAD8", surface: "#E4DCC4", surfaceSecondary: "#D4CCAC", text: "#080604", textSecondary: "#282010", textTertiary: "#706040", accent: "#080604", accentSecondary: "#282010", stampActive: "#080604", stampActiveIcon: "#F0EAD8", stampInactive: "#D4CCAC", border: "#C4B888", borderStrong: "#A09860", qrBackground: "#FFFFFF", qrForeground: "#080604", rewardBackground: "#E4DCC4" } },
  { id: "prussian-cream", name: "Prussian / Cream", tokens: { background: "#EEF0F4", surface: "#DDE0E8", surfaceSecondary: "#CDD0DC", text: "#060A14", textSecondary: "#0E1C38", textTertiary: "#6880A0", accent: "#0E1C38", accentSecondary: "#1A2E58", stampActive: "#0E1C38", stampActiveIcon: "#EEF0F4", stampInactive: "#CDD0DC", border: "#C0C8D8", borderStrong: "#A0A8C0", qrBackground: "#FFFFFF", qrForeground: "#060A14", rewardBackground: "#DDE0E8" } },
  { id: "sienna-sand", name: "Sienna / Sand", tokens: { background: "#F2E4CC", surface: "#E4D0B0", surfaceSecondary: "#D4BC94", text: "#140804", textSecondary: "#5A2810", textTertiary: "#9A7040", accent: "#7A2808", accentSecondary: "#AA3810", stampActive: "#7A2808", stampActiveIcon: "#F2E4CC", stampInactive: "#D4BC94", border: "#C8B080", borderStrong: "#A88858", qrBackground: "#FFFFFF", qrForeground: "#140804", rewardBackground: "#E4D0B0" } },
];

const template: CardTemplate = {
  id: "38-press", name: "PRESS", subtitle: "Letterpress",
  description: "Imprimerie artisanale, texte debossé, encrage à plat, typographie régnante.",
  categories: ["retro", "editorial", "coffee"],
  palettes, defaultPaletteId: "ink-cream",
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
        {/* Cadre letterpress — editorial */}
        <div style={{ position: "absolute", inset: thumbnail ? 3 : 6, border: `${thumbnail ? 0.5 : 1}px solid ${tokens.borderStrong}`, opacity: 0.35, pointerEvents: "none" }}/>
        <div style={{ position: "absolute", inset: thumbnail ? 5 : 9, border: `${thumbnail ? 0.5 : 1}px solid ${tokens.accent}`, opacity: 0.1, pointerEvents: "none" }}/>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: thumbnail ? "8% 8% 3%" : "9% 9% 4%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 5 : 8, background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.stampActiveIcon }}>{(data.nom[0] || "W").toUpperCase()}</span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 700, color: tokens.text, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.2 }}>{data.nom || "Établissement"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>{data.slogan}</div>}
            </div>
          </div>
          <div style={{ background: `${tokens.accent}18`, backdropFilter: "blur(8px)", borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px", border: `1px solid ${tokens.accent}25`, flexShrink: 0 }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 8%" : "0 9%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style="badge" tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}/>
        </div>

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: thumbnail ? "3% 8% 8%" : "4% 9% 9%", position: "relative", zIndex: 1 }}>
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
