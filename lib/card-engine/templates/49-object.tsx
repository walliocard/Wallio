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
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const serial = `WL-${String(Math.floor(Math.random() * 9000) + 1000)}-${String(Math.floor(Math.random() * 90) + 10)}`;
    return (
      <div style={{ width: "100%", height: "100%", background: `linear-gradient(145deg, ${tokens.surface} 0%, ${tokens.background} 40%, ${tokens.surface} 100%)`, display: "flex", flexDirection: "column", fontFamily: "'Helvetica Neue', Arial, sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Reflet haut */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: thumbnail ? "2px" : "3px", background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)` }}/>
        {/* Reflet gauche */}
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "1px", background: `linear-gradient(180deg, rgba(255,255,255,0.4), transparent)` }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              {data.logo_url && <img src={data.logo_url} alt="" style={{ width: thumbnail ? 14 : 22, height: thumbnail ? 14 : 22, objectFit: "cover", marginBottom: 3 }}/>}
              <div style={{ fontSize: thumbnail ? 7 : 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: tokens.text }}>{data.nom || "OBJECT"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: thumbnail ? 3 : 5, letterSpacing: "0.15em", color: tokens.textTertiary }}>WALLIO</div>
              <div style={{ fontSize: thumbnail ? 3 : 4, color: tokens.textTertiary, fontFamily: "monospace", marginTop: 1 }}>{serial}</div>
            </div>
          </div>

          {/* Grande forme centrale — composant mécanique */}
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 3 : 6 }}>
            <div style={{ width: thumbnail ? 14 : 26, height: thumbnail ? 14 : 26, borderRadius: "50%", border: `${thumbnail ? 1.5 : 2.5}px solid ${tokens.borderStrong}`, background: tokens.surfaceSecondary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: thumbnail ? 5 : 9, height: thumbnail ? 5 : 9, borderRadius: "50%", background: tokens.accent }}/>
            </div>
            <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="rounded" tokens={tokens} size={thumbnail ? 8 : 14} gap={thumbnail ? 2 : 3} perRow={9}/>
          </div>

          <div style={{ borderTop: `1px solid ${tokens.border}`, paddingTop: thumbnail ? 4 : 7, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: thumbnail ? 4 : 5, letterSpacing: "0.1em", color: tokens.textTertiary }}>SPEC: {data.nom_recompense.toUpperCase().slice(0, 12)}</div>
            <div style={{ fontSize: thumbnail ? 5 : 7, fontWeight: 700, color: tokens.textSecondary }}>{filled}/{data.objectif_tampons}</div>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
