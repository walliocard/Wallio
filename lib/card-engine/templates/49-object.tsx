import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "silver-black", name: "Silver / Black", tokens: { background: "#D8DCE0", surface: "#C8CCD0", surfaceSecondary: "#B8BCC0", text: "#080C10", textSecondary: "#283040", textTertiary: "#687080", accent: "#0A0E14", accentSecondary: "#283040", stampActive: "#0A0E14", stampActiveIcon: "#D8DCE0", stampInactive: "#B8BCC0", border: "#A8ACB4", borderStrong: "#888C98", qrBackground: "#FFFFFF", qrForeground: "#080C10", rewardBackground: "#C8CCD0" } },
  { id: "white-blue", name: "White / Blue", tokens: { background: "#F4F6FC", surface: "#E8ECFA", surfaceSecondary: "#D8DCEF", text: "#080C1C", textSecondary: "#1428B0", textTertiary: "#6878C8", accent: "#0C22CC", accentSecondary: "#1C38EE", stampActive: "#0C22CC", stampActiveIcon: "#F4F6FC", stampInactive: "#D8DCEF", border: "#D0D4EC", borderStrong: "#B0B8E0", qrBackground: "#FFFFFF", qrForeground: "#080C1C", rewardBackground: "#E8ECFA" } },
  { id: "black-purple", name: "Black / Purple", tokens: { background: "#06040E", surface: "#100C1C", surfaceSecondary: "#18142A", text: "#FFFFFF", textSecondary: "#A060FF", textTertiary: "#50306080", accent: "#8040FF", accentSecondary: "#A060FF", stampActive: "#A060FF", stampActiveIcon: "#06040E", stampInactive: "#18142A", border: "#201438", borderStrong: "#301C50", qrBackground: "#FFFFFF", qrForeground: "#06040E", rewardBackground: "#100C1C" } },
];

const template: CardTemplate = {
  id: "49-object", name: "OBJECT", subtitle: "Product Design",
  description: "Objet physique premium, détails techniques, numéro de série.",
  categories: ["premium", "modern", "minimal"],
  palettes, defaultPaletteId: "silver-black",
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
        background: `linear-gradient(145deg, ${tokens.surface} 0%, ${tokens.background} 40%, ${tokens.surface} 100%)`,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Reflet haut — premium */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: thumbnail ? "2px" : "3px", background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)`, pointerEvents: "none" }}/>
        {/* Reflet gauche */}
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "1px", background: `linear-gradient(180deg, rgba(255,255,255,0.4), transparent)`, pointerEvents: "none" }}/>

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
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 700, color: tokens.text, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.2 }}>{data.nom || "Établissement"}</div>
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
            style="rounded" tokens={tokens}
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
