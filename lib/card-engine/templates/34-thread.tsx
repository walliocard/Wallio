import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "ivory-sage", name: "Ivory / Sage", tokens: { background: "#F4F0E8", surface: "#E8E2D4", surfaceSecondary: "#D8D0BC", text: "#100E08", textSecondary: "#3A4028", textTertiary: "#8A9070", accent: "#4A5830", accentSecondary: "#687848", stampActive: "#4A5830", stampActiveIcon: "#F4F0E8", stampInactive: "#D8D0BC", border: "#D0C8B0", borderStrong: "#B0A888", qrBackground: "#FFFFFF", qrForeground: "#100E08", rewardBackground: "#E8E2D4" } },
  { id: "blush-cocoa", name: "Blush / Cocoa", tokens: { background: "#F5E8E4", surface: "#ECD8D0", surfaceSecondary: "#DEC8BC", text: "#180C0A", textSecondary: "#5A2818", textTertiary: "#A07868", accent: "#7A3020", accentSecondary: "#A04030", stampActive: "#7A3020", stampActiveIcon: "#F5E8E4", stampInactive: "#DEC8BC", border: "#D4C0B4", borderStrong: "#B4A094", qrBackground: "#FFFFFF", qrForeground: "#180C0A", rewardBackground: "#ECD8D0" } },
  { id: "navy-linen", name: "Navy / Linen", tokens: { background: "#F2EEE6", surface: "#E4DED2", surfaceSecondary: "#D4CEBC", text: "#080E1A", textSecondary: "#1A2848", textTertiary: "#7888A8", accent: "#1A2848", accentSecondary: "#2A3860", stampActive: "#1A2848", stampActiveIcon: "#F2EEE6", stampInactive: "#D4CEBC", border: "#C8C4B0", borderStrong: "#A8A48C", qrBackground: "#FFFFFF", qrForeground: "#080E1A", rewardBackground: "#E4DED2" } },
];

const template: CardTemplate = {
  id: "34-thread", name: "THREAD", subtitle: "Haute Couture",
  description: "Points de broderie, lignes fines cousues, élégance artisanale textile.",
  categories: ["luxury", "beauty", "editorial"],
  palettes, defaultPaletteId: "ivory-sage",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 16 : (dims?.logoSize ?? 28);
    const fmtV = dims?.format === "compact" ? 0.68 : dims?.format === "wide" ? 0.52 : 1;
    const dotCount = 8;

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Liseret brodé haut — luxury */}
        <svg style={{ position: "absolute", top: 0, left: 0, right: 0, width: "100%" }} height={thumbnail ? 6 : 11} viewBox="0 0 375 11" preserveAspectRatio="none">
          {Array.from({ length: dotCount }).map((_, i) => (
            <circle key={i} cx={24 + i * 47} cy="5.5" r={thumbnail ? 1.5 : 2.5} fill={tokens.accent} opacity="0.4"/>
          ))}
          <line x1="0" y1="5.5" x2="375" y2="5.5" stroke={tokens.accent} strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="4 6"/>
        </svg>
        {/* Liseret brodé bas */}
        <svg style={{ position: "absolute", bottom: 0, left: 0, right: 0, width: "100%" }} height={thumbnail ? 6 : 11} viewBox="0 0 375 11" preserveAspectRatio="none">
          {Array.from({ length: dotCount }).map((_, i) => (
            <circle key={i} cx={24 + i * 47} cy="5.5" r={thumbnail ? 1.5 : 2.5} fill={tokens.accent} opacity="0.4"/>
          ))}
          <line x1="0" y1="5.5" x2="375" y2="5.5" stroke={tokens.accent} strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="4 6"/>
        </svg>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: thumbnail ? "7% 7% 3%" : `${8*fmtV}% 8% ${4*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 5 : 8, background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.stampActiveIcon }}>{(data.nom[0] || "W").toUpperCase()}</span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 300, color: tokens.text, letterSpacing: 0.3, lineHeight: 1.2 }}>{data.nom || "Établissement"}</div>
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
            style="dot" tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}/>
        </div>

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: thumbnail ? "3% 7% 7%" : `${4*fmtV}% 8% ${8*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 300, color: tokens.text }}>{data.nom_recompense}</div>
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
