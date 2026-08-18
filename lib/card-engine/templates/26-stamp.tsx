import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "navy-cream", name: "Navy / Cream", tokens: { background: "#F5EDD8", surface: "#E8DCC0", surfaceSecondary: "#D8CCA8", text: "#0A1428", textSecondary: "#1E3060", textTertiary: "#6880A0", accent: "#0A1428", accentSecondary: "#1E3060", stampActive: "#0A1428", stampActiveIcon: "#F5EDD8", stampInactive: "#D8CCA8", border: "#C8B888", borderStrong: "#A89868", qrBackground: "#FFFFFF", qrForeground: "#0A1428", rewardBackground: "#E8DCC0" } },
  { id: "burgundy-cream", name: "Burgundy / Cream", tokens: { background: "#F5EDE0", surface: "#E8DCC8", surfaceSecondary: "#D8C8A8", text: "#1E0808", textSecondary: "#5A1818", textTertiary: "#9A6858", accent: "#5A1818", accentSecondary: "#8A2828", stampActive: "#5A1818", stampActiveIcon: "#F5EDE0", stampInactive: "#D8C8A8", border: "#C8A878", borderStrong: "#A88858", qrBackground: "#FFFFFF", qrForeground: "#1E0808", rewardBackground: "#E8DCC8" } },
  { id: "forest-beige", name: "Forest / Beige", tokens: { background: "#F0EDDC", surface: "#E0D8C0", surfaceSecondary: "#D0C8A4", text: "#0A1408", textSecondary: "#1E3818", textTertiary: "#6A7858", accent: "#1A3010", accentSecondary: "#2A5020", stampActive: "#1A3010", stampActiveIcon: "#F0EDDC", stampInactive: "#D0C8A4", border: "#C0B888", borderStrong: "#A09868", qrBackground: "#FFFFFF", qrForeground: "#0A1408", rewardBackground: "#E0D8C0" } },
];

const template: CardTemplate = {
  id: "26-stamp", name: "STAMP", subtitle: "Passport",
  description: "Passeport, cases visa, annotations administratives, QR = zone de contrôle.",
  categories: ["retro", "editorial", "artistic"],
  palettes, defaultPaletteId: "navy-cream",
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
        {/* Texture papier editorial — opacity 0.04 */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 18px, ${tokens.border}30 18px, ${tokens.border}30 19px)`,
        }}/>

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
            style="badge" tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}/>
        </div>

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`, position: "relative", zIndex: 1 }}>
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
