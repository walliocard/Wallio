import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "nude-burgundy", name: "Nude / Burgundy", tokens: { background: "#F0E4DC", surface: "#E4D0C4", surfaceSecondary: "#D4BCA8", text: "#1A0808", textSecondary: "#6A1828", textTertiary: "#AA8878", accent: "#8A2038", accentSecondary: "#BA3050", stampActive: "#8A2038", stampActiveIcon: "#F0E4DC", stampInactive: "#D4BCA8", border: "#D0B8A8", borderStrong: "#B09888", qrBackground: "#FFFFFF", qrForeground: "#1A0808", rewardBackground: "#E4D0C4" } },
  { id: "blush-forest", name: "Blush / Forest", tokens: { background: "#F5EAE8", surface: "#EAD8D4", surfaceSecondary: "#DAC4C0", text: "#0E0808", textSecondary: "#2A4020", textTertiary: "#8A7878", accent: "#2A4E28", accentSecondary: "#3A6E38", stampActive: "#2A4E28", stampActiveIcon: "#F5EAE8", stampInactive: "#DAC4C0", border: "#D4C0BC", borderStrong: "#B4A0A0", qrBackground: "#FFFFFF", qrForeground: "#0E0808", rewardBackground: "#EAD8D4" } },
  { id: "cream-black", name: "Cream / Black", tokens: { background: "#F8F4EE", surface: "#EEE8DC", surfaceSecondary: "#DED8C8", text: "#0A0A0A", textSecondary: "#3A3A3A", textTertiary: "#9A9A9A", accent: "#0A0A0A", accentSecondary: "#3A3A3A", stampActive: "#0A0A0A", stampActiveIcon: "#F8F4EE", stampInactive: "#DED8C8", border: "#C8C4BC", borderStrong: "#A8A49C", qrBackground: "#FFFFFF", qrForeground: "#0A0A0A", rewardBackground: "#EEE8DC" } },
];

const template: CardTemplate = {
  id: "33-silk", name: "SILK", subtitle: "Beauty",
  description: "Institut, beauté, soie. Formes fluides, typographie fine, drops comme tampons.",
  categories: ["beauty", "luxury", "minimal"],
  palettes, defaultPaletteId: "nude-burgundy",
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
        background: `linear-gradient(135deg, ${tokens.background} 0%, ${tokens.surface} 100%)`,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Forme fluide décorative — luxury opacity 0.1 */}
        <svg style={{ position: "absolute", right: thumbnail ? "-5%" : "-8%", bottom: thumbnail ? "10%" : "15%", opacity: 0.1, pointerEvents: "none" }} width={thumbnail ? 50 : 90} height={thumbnail ? 50 : 90} viewBox="0 0 90 90" fill="none">
          <path d="M45 5 C72 0 90 22 88 50 C86 78 62 90 38 87 C14 84 0 62 4 36 C8 10 18 10 45 5Z" fill={tokens.accent}/>
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
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 300, color: tokens.text, letterSpacing: 0.5, lineHeight: 1.2 }}>{data.nom || "Établissement"}</div>
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
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 300, color: tokens.text }}>{data.nom_recompense}</div>
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
