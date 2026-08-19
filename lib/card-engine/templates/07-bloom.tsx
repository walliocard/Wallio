import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "sage-cream", name: "Sage / Cream", tokens: { background: "#EBF0E8", surface: "#D8E2D4", surfaceSecondary: "#C4D2BE", text: "#1A2818", textSecondary: "#3A5030", textTertiary: "#7A9070", accent: "#4A7A50", accentSecondary: "#72A878", stampActive: "#4A7A50", stampActiveIcon: "#EBF0E8", stampInactive: "#C4D2BE", border: "#C0CDB8", borderStrong: "#9AAD90", qrBackground: "#FFFFFF", qrForeground: "#1A2818", rewardBackground: "#D8E2D4" } },
  { id: "terracotta-sand", name: "Terracotta / Sand", tokens: { background: "#F2EAE0", surface: "#E4D4C0", surfaceSecondary: "#D0BC9E", text: "#2A1408", textSecondary: "#6A3820", textTertiary: "#AA7850", accent: "#A0502A", accentSecondary: "#C87050", stampActive: "#A0502A", stampActiveIcon: "#F2EAE0", stampInactive: "#D0BC9E", border: "#C8B090", borderStrong: "#A89070", qrBackground: "#FFFFFF", qrForeground: "#2A1408", rewardBackground: "#E4D4C0" } },
  { id: "dusty-pink-forest", name: "Dusty Pink / Forest", tokens: { background: "#F5EAE8", surface: "#E8D4D0", surfaceSecondary: "#D8BEB8", text: "#1E0E0C", textSecondary: "#5A2820", textTertiary: "#9A6860", accent: "#7A3040", accentSecondary: "#A04860", stampActive: "#7A3040", stampActiveIcon: "#F5EAE8", stampInactive: "#D8BEB8", border: "#D0B8B0", borderStrong: "#B09090", qrBackground: "#FFFFFF", qrForeground: "#1E0E0C", rewardBackground: "#E8D4D0" } },
];

const template: CardTemplate = {
  id: "07-bloom", name: "BLOOM", subtitle: "Botanical",
  description: "Univers botanique, feuilles SVG, formes organiques douces.",
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
        {/* Feuilles décoratives très subtiles */}
        <svg style={{ position: "absolute", right: thumbnail ? "-5%" : "-8%", top: thumbnail ? "-10%" : "-15%", opacity: 0.09 }} width={thumbnail ? 60 : 110} height={thumbnail ? 80 : 150} viewBox="0 0 110 150" fill="none">
          <path d="M55 10 C30 30 10 70 30 110 C50 150 80 130 90 90 C100 50 80 10 55 10Z" fill={tokens.accent}/>
          <path d="M55 10 C55 10 55 80 30 110" stroke={tokens.background} strokeWidth="1.5"/>
        </svg>
        <svg style={{ position: "absolute", left: thumbnail ? "-3%" : "-5%", bottom: thumbnail ? "5%" : "8%", opacity: 0.07 }} width={thumbnail ? 40 : 70} height={thumbnail ? 55 : 100} viewBox="0 0 70 100" fill="none">
          <path d="M35 5 C15 25 5 55 20 80 C35 100 55 85 60 60 C65 35 50 5 35 5Z" fill={tokens.accentSecondary}/>
          <path d="M35 5 C35 5 35 55 20 80" stroke={tokens.background} strokeWidth="1.2"/>
        </svg>

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "7% 8% 3%" : `${8*fmtV}% 9% ${4*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{
                width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: thumbnail ? 5 : 8,
                background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.stampActiveIcon }}>
                  {(data.nom[0] || "W").toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 600, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>
                {data.nom || "Bloom"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>
                  {data.slogan}
                </div>
              )}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}18`, backdropFilter: "blur(8px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: `1px solid ${tokens.accent}25`, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", lineHeight: 1, color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS — étoiles botaniques */}
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
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 8%" : "0 9%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style={(dims?.stampStyle ?? "star")} tokens={tokens}
            size={thumbnail ? 9 : 18} gap={thumbnail ? 3 : 5} perRow={9}
          />
        </div>
          )}

        {/* FOOTER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: thumbnail ? "3% 8% 7%" : `${4*fmtV}% 9% ${8*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
              Récompense
            </div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}15`, backdropFilter: "blur(8px)",
            borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: `1px solid ${tokens.accent}20`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, lineHeight: 1, color: tokens.accent }}>
              {filled}/{data.objectif_tampons}
            </span>
            </div>

            {!thumbnail && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 5, letterSpacing: "0.12em", color: tokens.textTertiary, textTransform: "uppercase" as const, marginBottom: 1 }}>Titulaire</div>
                <div style={{ fontSize: ss(9), fontWeight: 600, color: tokens.text }}>
                  {data.client_prenom ? `${data.client_prenom} ${data.client_nom || ""}`.trim() : "Prénom Nom"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
