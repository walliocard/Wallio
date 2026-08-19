import type { CardTemplate, CardPalette } from "../types";
import { renderStrip } from "../strip";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "orange-pink", name: "Orange / Pink", tokens: { background: "#FF4808", surface: "#E83800", surfaceSecondary: "#CC2800", text: "#FFFFFF", textSecondary: "#FF80C0", textTertiary: "#C04060", accent: "#FF60C0", accentSecondary: "#FF80D8", stampActive: "#FFFFFF", stampActiveIcon: "#FF4808", stampInactive: "#CC2800", border: "#E03000", borderStrong: "#C02000", qrBackground: "#FFFFFF", qrForeground: "#FF4808", rewardBackground: "#E83800" } },
  { id: "blue-yellow", name: "Blue / Yellow", tokens: { background: "#0828E0", surface: "#0618C0", surfaceSecondary: "#040CA0", text: "#FFFFFF", textSecondary: "#FFEE00", textTertiary: "#808000", accent: "#FFEE00", accentSecondary: "#FFF060", stampActive: "#FFEE00", stampActiveIcon: "#0828E0", stampInactive: "#040CA0", border: "#0818B0", borderStrong: "#1030D0", qrBackground: "#FFFFFF", qrForeground: "#0828E0", rewardBackground: "#0618C0" } },
  { id: "purple-lime", name: "Purple / Lime", tokens: { background: "#5808D0", surface: "#4800B0", surfaceSecondary: "#380090", text: "#FFFFFF", textSecondary: "#A8FF30", textTertiary: "#508010", accent: "#A8FF30", accentSecondary: "#C8FF60", stampActive: "#A8FF30", stampActiveIcon: "#5808D0", stampInactive: "#380090", border: "#4000A0", borderStrong: "#5010C0", qrBackground: "#FFFFFF", qrForeground: "#5808D0", rewardBackground: "#4800B0" } },
];

const template: CardTemplate = {
  id: "45-energy", name: "ENERGY", subtitle: "Bold Pop",
  description: "Couleurs explosives, typographie immense, formes énergétiques.",
  categories: ["colorful", "sport", "street"],
  palettes, defaultPaletteId: "orange-pink",
  render({ data, tokens, thumbnail, dimensions, strip }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 16 : (dims?.logoSize ?? 28);
    const fmtV = dims?.format === "compact" ? 0.68 : dims?.format === "wide" ? 0.52 : 1;

    if (strip) return renderStrip(data, tokens, {
      decoratives: (
        <svg style={{ position: "absolute", right: "8%", top: "50%", transform: "translateY(-50%)", opacity: 0.1, pointerEvents: "none" }} width={55} height={85} viewBox="0 0 55 85" fill="none">
          <path d="M35 5 L10 45 L28 45 L20 80 L48 35 L30 35 Z" fill={tokens.accent}/>
        </svg>
      ),
    });

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Éclair SVG — sport opacity 0.1 */}
        <svg style={{ position: "absolute", right: thumbnail ? "5%" : "8%", top: "50%", transform: "translateY(-50%)", opacity: 0.1, pointerEvents: "none" }} width={thumbnail ? 30 : 55} height={thumbnail ? 45 : 85} viewBox="0 0 55 85" fill="none">
          <path d="M35 5 L10 45 L28 45 L20 80 L48 35 L30 35 Z" fill={tokens.accent}/>
        </svg>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: thumbnail ? "6% 7% 3%" : `${7*fmtV}% 8% ${4*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 5 : 8, background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 900, color: tokens.stampActiveIcon }}>{(data.nom[0] || "W").toUpperCase()}</span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 900, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: -0.5, lineHeight: 1.1 }}>{data.nom || "Établissement"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: rs(8), color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{data.slogan}</div>}
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
            style={(dims?.stampStyle ?? "star")} tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}/>
        </div>
          )}

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 700, color: "#FFFFFF" }}>{data.nom_recompense}</div>
          </div>
          <div style={{ background: tokens.accent, backdropFilter: "blur(8px)", borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 900, lineHeight: 1, color: tokens.stampActiveIcon }}>{filled}/{data.objectif_tampons}</span>
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
