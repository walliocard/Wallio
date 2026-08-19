import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "sage-cream", name: "Sage / Cream", tokens: { background: "#E8F0E8", surface: "#D4E4D4", surfaceSecondary: "#C0D4C0", text: "#0E1A0E", textSecondary: "#3A5A3A", textTertiary: "#7A9A7A", accent: "#3A6A3A", accentSecondary: "#5A9A5A", stampActive: "#3A6A3A", stampActiveIcon: "#E8F0E8", stampInactive: "#C0D4C0", border: "#B4CDB4", borderStrong: "#90B090", qrBackground: "#FFFFFF", qrForeground: "#0E1A0E", rewardBackground: "#D4E4D4" } },
  { id: "peach-burgundy", name: "Peach / Burgundy", tokens: { background: "#F5E8DC", surface: "#EAD4C4", surfaceSecondary: "#DAC0AA", text: "#1A0808", textSecondary: "#6A2028", textTertiary: "#AA7870", accent: "#8A2030", accentSecondary: "#BA3040", stampActive: "#8A2030", stampActiveIcon: "#F5E8DC", stampInactive: "#DAC0AA", border: "#D0B4A0", borderStrong: "#B09080", qrBackground: "#FFFFFF", qrForeground: "#1A0808", rewardBackground: "#EAD4C4" } },
  { id: "sky-sand", name: "Sky / Sand", tokens: { background: "#E0EEF5", surface: "#C8DDE8", surfaceSecondary: "#B0CCDA", text: "#081828", textSecondary: "#205080", textTertiary: "#6090B0", accent: "#1860A0", accentSecondary: "#2880D0", stampActive: "#1860A0", stampActiveIcon: "#E0EEF5", stampInactive: "#B0CCDA", border: "#A0C4D8", borderStrong: "#78A8C0", qrBackground: "#FFFFFF", qrForeground: "#081828", rewardBackground: "#C8DDE8" } },
];

const template: CardTemplate = {
  id: "29-organic", name: "ORGANIC", subtitle: "Soft Organic",
  description: "Formes fluides, blob shapes, aucune ligne droite dominante.",
  categories: ["nature", "beauty", "minimal"],
  palettes, defaultPaletteId: "sage-cream",
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
        {/* Blob organique — nature opacity 0.1 */}
        <svg style={{ position: "absolute", right: thumbnail ? "-15%" : "-20%", top: thumbnail ? "-20%" : "-30%", opacity: 0.1, pointerEvents: "none" }} width={thumbnail ? 80 : 150} height={thumbnail ? 80 : 150} viewBox="0 0 150 150" fill="none">
          <path d="M75 10 C110 5 145 35 140 75 C135 115 100 140 65 138 C30 136 5 105 8 68 C11 31 40 15 75 10Z" fill={tokens.accent}/>
        </svg>
        <svg style={{ position: "absolute", left: thumbnail ? "-10%" : "-15%", bottom: thumbnail ? "5%" : "8%", opacity: 0.08, pointerEvents: "none" }} width={thumbnail ? 50 : 90} height={thumbnail ? 50 : 90} viewBox="0 0 90 90" fill="none">
          <path d="M45 5 C70 0 90 20 88 48 C86 76 62 90 38 87 C14 84 0 62 4 36 C8 10 20 10 45 5Z" fill={tokens.accentSecondary}/>
        </svg>

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
          <div style={{ background: `${tokens.accent}18`, backdropFilter: "blur(8px)", borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px", border: `1px solid ${tokens.accent}25`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", lineHeight: 1, color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS */}
                  {/* Mode progressif */}
          {data.mode === "progressif" && data.paliers ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
              <ProgressiveStamps
                paliers={data.paliers}
                palier_actuel={data.palier_actuel ?? 0}
                paliers_valides={data.paliers_valides ?? []}
                tampons={data.tampons}
                tokens={tokens}
                stampStyle={dims?.stampStyle}
                stampSize={dims?.stampSize}
                thumbnail={thumbnail}
              />
            </div>
          ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style={(dims?.stampStyle ?? "circle")} tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}/>
        </div>
          )}

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>{data.nom_recompense}</div>
          </div>
          <div style={{ background: `${tokens.accent}15`, backdropFilter: "blur(8px)", borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px", border: `1px solid ${tokens.accent}20` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, lineHeight: 1, color: tokens.accent }}>{filled}/{data.objectif_tampons}</span>
            </div>
          </div>
        
            {/* Titulaire */}
            {!thumbnail && (
              <div style={{ marginTop: thumbnail ? 3 : 6 }}>
                <div style={{ fontSize: 5, letterSpacing: "0.12em", color: tokens.textTertiary, textTransform: "uppercase" as const, marginBottom: 1 }}>Titulaire</div>
                <div style={{ fontSize: thumbnail ? 5 : ss(9), fontWeight: 600, color: tokens.text }}>
                  {data.client_prenom ? `${data.client_prenom} ${data.client_nom || ""}`.trim() : "Prénom Nom"}
                </div>
              </div>
            )}
            </div>
      </div>
    );
  },
};
export default template;
