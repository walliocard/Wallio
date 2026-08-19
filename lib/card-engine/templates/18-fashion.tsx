import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "black-white", name: "Black / White", tokens: { background: "#080808", surface: "#141414", surfaceSecondary: "#222222", text: "#FFFFFF", textSecondary: "#888888", textTertiary: "#444444", accent: "#FFFFFF", accentSecondary: "#888888", stampActive: "#FFFFFF", stampActiveIcon: "#080808", stampInactive: "#222222", border: "#252525", borderStrong: "#383838", qrBackground: "#FFFFFF", qrForeground: "#080808", rewardBackground: "#141414" } },
  { id: "cream-burgundy", name: "Cream / Burgundy", tokens: { background: "#F5F0E8", surface: "#E8E0D0", surfaceSecondary: "#D8D0BC", text: "#0A0A0A", textSecondary: "#6A1E2A", textTertiary: "#AA8A90", accent: "#8A1828", accentSecondary: "#C0283C", stampActive: "#8A1828", stampActiveIcon: "#F5F0E8", stampInactive: "#D8D0BC", border: "#D0C8B0", borderStrong: "#B0A890", qrBackground: "#FFFFFF", qrForeground: "#0A0A0A", rewardBackground: "#E8E0D0" } },
  { id: "silver-charcoal", name: "Silver / Charcoal", tokens: { background: "#D0D4D8", surface: "#B8BEC4", surfaceSecondary: "#A0A8B0", text: "#0A0E12", textSecondary: "#283040", textTertiary: "#6070808", accent: "#1C2430", accentSecondary: "#283848", stampActive: "#1C2430", stampActiveIcon: "#D0D4D8", stampInactive: "#A0A8B0", border: "#A0A8B0", borderStrong: "#808890", qrBackground: "#FFFFFF", qrForeground: "#0A0E12", rewardBackground: "#B8BEC4" } },
];

const template: CardTemplate = {
  id: "18-fashion", name: "FASHION", subtitle: "Editorial Fashion",
  description: "Magazine de mode, typographie immense, composition asymétrique.",
  categories: ["editorial", "luxury", "beauty"],
  palettes, defaultPaletteId: "black-white",
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
        {/* Énorme typographie fond — très subtile */}
        <div style={{
          position: "absolute", bottom: thumbnail ? "-10%" : "-15%", left: thumbnail ? "-3%" : "-5%",
          fontSize: thumbnail ? 45 : 80, fontWeight: 900, color: tokens.surface,
          lineHeight: 1, letterSpacing: -3, userSelect: "none", textTransform: "uppercase",
          pointerEvents: "none",
        }}>
          {(data.nom || "FA").slice(0, 2)}
        </div>

        {/* Bande verticale droite — Liquid Glass */}
        <div style={{
          position: "absolute", right: thumbnail ? 18 : 32, top: 0, bottom: 0,
          width: thumbnail ? 1.5 : 2.5, background: tokens.accent, opacity: 0.6,
        }}/>

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "6% 7% 3%" : `${7*fmtV}% 8% ${4*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.2em", color: tokens.textTertiary, marginBottom: 2 }}>N° — {filled}</div>
            <div style={{ fontSize: thumbnail ? 10 : ns(19), fontWeight: 900, color: tokens.text, textTransform: "uppercase", lineHeight: 0.9, letterSpacing: -1 }}>
              {data.nom || "FASHION"}
            </div>
            {data.slogan && !thumbnail && (
              <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 4 }}>
                {data.slogan}
              </div>
            )}
          </div>
          <div style={{
            background: `${tokens.accent}18`, backdropFilter: "blur(8px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: `1px solid ${tokens.accent}28`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", lineHeight: 1, color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS — dots fashion */}
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
            style={(dims?.stampStyle ?? "dot")} tokens={tokens}
            size={thumbnail ? 6 : 12} gap={thumbnail ? 3 : 5} perRow={9}
          />
        </div>
          )}

        {/* FOOTER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.textSecondary }}>
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
