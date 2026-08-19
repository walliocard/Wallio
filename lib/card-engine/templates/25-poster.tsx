import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "red-cream", name: "Red / Cream", tokens: { background: "#CC1818", surface: "#AA1010", surfaceSecondary: "#880808", text: "#FAF0E0", textSecondary: "#F0D0A0", textTertiary: "#C09050", accent: "#FAF0E0", accentSecondary: "#F0D0A0", stampActive: "#FAF0E0", stampActiveIcon: "#CC1818", stampInactive: "#880808", border: "#AA1010", borderStrong: "#880808", qrBackground: "#FAF0E0", qrForeground: "#CC1818", rewardBackground: "#AA1010" } },
  { id: "blue-yellow", name: "Blue / Yellow", tokens: { background: "#0A28C0", surface: "#0820A0", surfaceSecondary: "#061880", text: "#FFEE00", textSecondary: "#FFD000", textTertiary: "#B09000", accent: "#FFEE00", accentSecondary: "#FFD000", stampActive: "#FFEE00", stampActiveIcon: "#0A28C0", stampInactive: "#061880", border: "#082090", borderStrong: "#061880", qrBackground: "#FFFFFF", qrForeground: "#0A28C0", rewardBackground: "#0820A0" } },
  { id: "orange-purple", name: "Orange / Purple", tokens: { background: "#E05010", surface: "#C04008", surfaceSecondary: "#A03000", text: "#FFFFFF", textSecondary: "#E0A0FF", textTertiary: "#805080", accent: "#D060FF", accentSecondary: "#B040E0", stampActive: "#D060FF", stampActiveIcon: "#E05010", stampInactive: "#A03000", border: "#B03800", borderStrong: "#903000", qrBackground: "#FFFFFF", qrForeground: "#E05010", rewardBackground: "#C04008" } },
];

const template: CardTemplate = {
  id: "25-poster", name: "POSTER", subtitle: "Modern Poster",
  description: "Carte = affiche miniature. Titre énorme, composition dynamique.",
  categories: ["colorful", "street", "editorial"],
  palettes, defaultPaletteId: "red-cream",
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
        {/* Bande bas — poster */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: thumbnail ? "28%" : "32%", background: tokens.surface, opacity: 0.5 }}/>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: thumbnail ? "6% 7% 3%" : `${7*fmtV}% 8% ${4*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 5 : 8, background: `${tokens.accent}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 900, color: tokens.accent }}>{(data.nom[0] || "W").toUpperCase()}</span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 900, color: tokens.text, letterSpacing: -0.5, lineHeight: 1.1, textTransform: "uppercase" }}>{data.nom || "POSTER"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: rs(8), color: `${tokens.text}80`, marginTop: 2 }}>{data.slogan}</div>}
            </div>
          </div>
          <div style={{ background: `${tokens.accent}25`, backdropFilter: "blur(8px)", borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px", border: `1px solid ${tokens.accent}40`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: `${tokens.text}70`, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>{data.nom_recompense}</div>
          </div>
          <div style={{ background: `${tokens.accent}20`, backdropFilter: "blur(8px)", borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px", border: `1px solid ${tokens.accent}35` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 900, color: tokens.accent }}>{filled}/{data.objectif_tampons}</span>
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
