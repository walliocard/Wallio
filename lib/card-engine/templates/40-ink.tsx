import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "ink-paper", name: "Ink / Paper", tokens: { background: "#F4F0E8", surface: "#E4E0D4", surfaceSecondary: "#D4D0C4", text: "#0A0804", textSecondary: "#3A3428", textTertiary: "#8A8478", accent: "#0A0804", accentSecondary: "#3A3428", stampActive: "#0A0804", stampActiveIcon: "#F4F0E8", stampInactive: "#D4D0C4", border: "#C4C0B4", borderStrong: "#A4A094", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#E4E0D4" } },
  { id: "ink-red", name: "Ink / Red", tokens: { background: "#0A0804", surface: "#141208", surfaceSecondary: "#1E1C10", text: "#F4F0E8", textSecondary: "#AA2020", textTertiary: "#503018", accent: "#CC2020", accentSecondary: "#EE3030", stampActive: "#CC2020", stampActiveIcon: "#0A0804", stampInactive: "#1E1C10", border: "#282010", borderStrong: "#3C3018", qrBackground: "#F4F0E8", qrForeground: "#0A0804", rewardBackground: "#141208" } },
  { id: "charcoal-sand", name: "Charcoal / Sand", tokens: { background: "#2A2820", surface: "#38362C", surfaceSecondary: "#484638", text: "#F0E8D0", textSecondary: "#C0B080", textTertiary: "#705840", accent: "#C0B080", accentSecondary: "#E0D0A0", stampActive: "#C0B080", stampActiveIcon: "#2A2820", stampInactive: "#484638", border: "#3A3828", borderStrong: "#504E38", qrBackground: "#F0E8D0", qrForeground: "#2A2820", rewardBackground: "#38362C" } },
];

const template: CardTemplate = {
  id: "40-ink", name: "INK", subtitle: "Japanese Ink",
  description: "Pinceau abstrait, espace vide, sceaux circulaires, encre japonaise.",
  categories: ["artistic", "minimal", "luxury"],
  palettes, defaultPaletteId: "ink-paper",
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
        {/* Trait de pinceau SVG — opacity 0.06 */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06, pointerEvents: "none" }} viewBox="0 0 375 246" preserveAspectRatio="none">
          <path d="M-20 80 C60 40 150 120 260 60 C320 30 370 90 400 70" stroke={tokens.text} strokeWidth="40" strokeLinecap="round" fill="none"/>
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
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 300, color: tokens.text, letterSpacing: 1.5, lineHeight: 1.2 }}>{data.nom || "Établissement"}</div>
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
