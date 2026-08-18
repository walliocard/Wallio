import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "paper-black", name: "Paper / Black", tokens: { background: "#F4EED8", surface: "#E8DEC0", surfaceSecondary: "#D8CCA8", text: "#0A0804", textSecondary: "#2A2010", textTertiary: "#6A6048", accent: "#0A0804", accentSecondary: "#2A2010", stampActive: "#0A0804", stampActiveIcon: "#F4EED8", stampInactive: "#D8CCA8", border: "#C0B088", borderStrong: "#A09068", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#E8DEC0" } },
  { id: "paper-burgundy", name: "Paper / Burgundy", tokens: { background: "#F5F0E4", surface: "#EAE0C8", surfaceSecondary: "#D8CCA8", text: "#0A0804", textSecondary: "#6A1828", textTertiary: "#A07860", accent: "#7A1020", accentSecondary: "#A82030", stampActive: "#7A1020", stampActiveIcon: "#F5F0E4", stampInactive: "#D8CCA8", border: "#C8B888", borderStrong: "#A89870", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#EAE0C8" } },
  { id: "paper-navy", name: "Paper / Navy", tokens: { background: "#F2EEE0", surface: "#E4DCC8", surfaceSecondary: "#D4C8A8", text: "#0A0804", textSecondary: "#0E2040", textTertiary: "#6880A0", accent: "#0A1E3E", accentSecondary: "#1A3060", stampActive: "#0A1E3E", stampActiveIcon: "#F2EEE0", stampInactive: "#D4C8A8", border: "#C8BA88", borderStrong: "#A89A68", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#E4DCC8" } },
];

const template: CardTemplate = {
  id: "28-newspaper", name: "NEWSPAPER", subtitle: "Editorial Retro",
  description: "Journal, colonnes, serif, typographie historique. Aspect presse ancienne.",
  categories: ["retro", "editorial", "artistic"],
  palettes, defaultPaletteId: "paper-black",
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
        {/* Texture papier subtile — editorial opacity 0.04 */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px, ${tokens.border}25 20px, ${tokens.border}25 21px)`,
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
            style={(dims?.stampStyle ?? "badge")} tokens={tokens}
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
