import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "black-lime", name: "Black / Lime", tokens: { background: "#080A06", surface: "#101408", surfaceSecondary: "#181E0C", text: "#FFFFFF", textSecondary: "#B8FF20", textTertiary: "#506010", accent: "#B8FF20", accentSecondary: "#D8FF60", stampActive: "#B8FF20", stampActiveIcon: "#080A06", stampInactive: "#181E0C", border: "#1A2008", borderStrong: "#283010", qrBackground: "#FFFFFF", qrForeground: "#080A06", rewardBackground: "#101408" } },
  { id: "navy-orange", name: "Navy / Orange", tokens: { background: "#080C1A", surface: "#101422", surfaceSecondary: "#182030", text: "#FFFFFF", textSecondary: "#FF7820", textTertiary: "#504018", accent: "#FF7820", accentSecondary: "#FF9840", stampActive: "#FF7820", stampActiveIcon: "#080C1A", stampInactive: "#182030", border: "#18203A", borderStrong: "#283050", qrBackground: "#FFFFFF", qrForeground: "#080C1A", rewardBackground: "#101422" } },
  { id: "white-cobalt", name: "White / Cobalt", tokens: { background: "#F8F8FC", surface: "#ECEDFA", surfaceSecondary: "#D8DAEF", text: "#0A0C1A", textSecondary: "#1A20A0", textTertiary: "#6870C0", accent: "#1428CC", accentSecondary: "#2038EE", stampActive: "#1428CC", stampActiveIcon: "#F8F8FC", stampInactive: "#D8DAEF", border: "#D0D4EC", borderStrong: "#B0B8DC", qrBackground: "#FFFFFF", qrForeground: "#0A0C1A", rewardBackground: "#ECEDFA" } },
];

const template: CardTemplate = {
  id: "43-athletic", name: "ATHLETIC", subtitle: "Sport Performance",
  description: "Dynamique, chiffres géants, barres de progression, énergie pure.",
  categories: ["sport", "modern", "street"],
  palettes, defaultPaletteId: "black-lime",
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
        {/* Bande diagonale — sport */}
        <div style={{ position: "absolute", top: 0, right: thumbnail ? "22%" : "27%", width: thumbnail ? 2 : 4, height: "100%", background: tokens.accent, transform: "skewX(-10deg)", opacity: 0.35, pointerEvents: "none" }}/>

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
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 900, color: tokens.text, letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1.2 }}>{data.nom || "Établissement"}</div>
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
            style="star" tokens={tokens}
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
