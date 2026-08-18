import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "kraft-black", name: "Kraft / Black", tokens: { background: "#E8D8A8", surface: "#D8C890", surfaceSecondary: "#C8B878", text: "#0A0804", textSecondary: "#2A2010", textTertiary: "#6A5830", accent: "#0A0804", accentSecondary: "#2A2010", stampActive: "#0A0804", stampActiveIcon: "#E8D8A8", stampInactive: "#D8C890", border: "#C0A858", borderStrong: "#A08838", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#D8C890" } },
  { id: "cream-forest", name: "Cream / Forest", tokens: { background: "#F5F0E4", surface: "#E8E0CC", surfaceSecondary: "#D8D0B4", text: "#0A1008", textSecondary: "#2A4020", textTertiary: "#7A8860", accent: "#1E3818", accentSecondary: "#2E5428", stampActive: "#1E3818", stampActiveIcon: "#F5F0E4", stampInactive: "#D8D0B4", border: "#C8C0A4", borderStrong: "#A8A080", qrBackground: "#FFFFFF", qrForeground: "#0A1008", rewardBackground: "#E8E0CC" } },
  { id: "terracotta-navy", name: "Terracotta / Navy", tokens: { background: "#E8D4C0", surface: "#D8C0A8", surfaceSecondary: "#C8AC90", text: "#0A1028", textSecondary: "#1A2848", textTertiary: "#6880A0", accent: "#1A2848", accentSecondary: "#2A3A60", stampActive: "#1A2848", stampActiveIcon: "#E8D4C0", stampInactive: "#C8AC90", border: "#B89870", borderStrong: "#988050", qrBackground: "#FFFFFF", qrForeground: "#0A1028", rewardBackground: "#D8C0A8" } },
];

const template: CardTemplate = {
  id: "39-stamped", name: "STAMPED", subtitle: "Handmade",
  description: "Artisanal, imperfections simulées, marques d'encre, texture papier.",
  categories: ["retro", "coffee", "restaurant"],
  palettes, defaultPaletteId: "kraft-black",
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
        {/* Tampon circulaire en fond — editorial opacity 0.06 */}
        <div style={{ position: "absolute", right: thumbnail ? "3%" : "5%", top: "50%", transform: "translateY(-50%) rotate(-8deg)", width: thumbnail ? 35 : 65, height: thumbnail ? 35 : 65, borderRadius: "50%", border: `${thumbnail ? 2 : 3}px solid ${tokens.accent}`, opacity: 0.06, pointerEvents: "none" }}/>

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
