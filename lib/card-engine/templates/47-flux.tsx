import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "blue-purple", name: "Blue / Purple", tokens: { background: "#080820", surface: "rgba(255,255,255,0.08)", surfaceSecondary: "rgba(255,255,255,0.04)", text: "#FFFFFF", textSecondary: "#A080FF", textTertiary: "#504080", accent: "#6060FF", accentSecondary: "#A060FF", stampActive: "#FFFFFF", stampActiveIcon: "#080820", stampInactive: "rgba(255,255,255,0.12)", border: "rgba(255,255,255,0.1)", borderStrong: "rgba(255,255,255,0.18)", qrBackground: "#FFFFFF", qrForeground: "#080820", rewardBackground: "rgba(255,255,255,0.06)" } },
  { id: "pink-orange", name: "Pink / Orange", tokens: { background: "#1A0810", surface: "rgba(255,255,255,0.08)", surfaceSecondary: "rgba(255,255,255,0.04)", text: "#FFFFFF", textSecondary: "#FF8080", textTertiary: "#804040", accent: "#FF4060", accentSecondary: "#FF8040", stampActive: "#FFFFFF", stampActiveIcon: "#1A0810", stampInactive: "rgba(255,255,255,0.12)", border: "rgba(255,255,255,0.1)", borderStrong: "rgba(255,255,255,0.18)", qrBackground: "#FFFFFF", qrForeground: "#1A0810", rewardBackground: "rgba(255,255,255,0.06)" } },
  { id: "green-blue", name: "Green / Blue", tokens: { background: "#041410", surface: "rgba(255,255,255,0.08)", surfaceSecondary: "rgba(255,255,255,0.04)", text: "#FFFFFF", textSecondary: "#40E080", textTertiary: "#205040", accent: "#20C060", accentSecondary: "#20A0C0", stampActive: "#FFFFFF", stampActiveIcon: "#041410", stampInactive: "rgba(255,255,255,0.12)", border: "rgba(255,255,255,0.1)", borderStrong: "rgba(255,255,255,0.18)", qrBackground: "#FFFFFF", qrForeground: "#041410", rewardBackground: "rgba(255,255,255,0.06)" } },
];

const template: CardTemplate = {
  id: "47-flux", name: "FLUX", subtitle: "Abstract Digital",
  description: "Formes abstraites fluides, gradient sophistiqué, surface translucide.",
  categories: ["modern", "colorful", "premium"],
  palettes, defaultPaletteId: "blue-purple",
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
        {/* Formes fluides SVG — abstract */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 375 246" preserveAspectRatio="none">
          <defs>
            <radialGradient id={`fg-${thumbnail}`} cx="70%" cy="30%">
              <stop offset="0%" stopColor={tokens.accent} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={tokens.accentSecondary} stopOpacity="0"/>
            </radialGradient>
            <radialGradient id={`fg2-${thumbnail}`} cx="20%" cy="80%">
              <stop offset="0%" stopColor={tokens.accentSecondary} stopOpacity="0.18"/>
              <stop offset="100%" stopColor={tokens.accent} stopOpacity="0"/>
            </radialGradient>
          </defs>
          <path d="M200 -30 C300 20 350 100 280 180 C210 260 100 230 50 160 C0 90 40 10 200 -30Z" fill={`url(#fg-${thumbnail})`}/>
          <path d="M-30 120 C20 60 100 30 150 80 C200 130 180 220 100 240 C20 260 -80 180 -30 120Z" fill={`url(#fg2-${thumbnail})`}/>
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
          <div style={{ background: `${tokens.accent}18`, backdropFilter: "blur(8px)", borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px", border: `1px solid ${tokens.accent}25`, flexShrink: 0 }}>
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
            style={(dims?.stampStyle ?? "dot")} tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}/>
        </div>
          )}

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>{data.nom_recompense}</div>
          </div>
          <div style={{ background: tokens.surface, backdropFilter: "blur(10px)", borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px", border: `1px solid ${tokens.border}` }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, color: tokens.text }}>{filled}/{data.objectif_tampons}</span>
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
