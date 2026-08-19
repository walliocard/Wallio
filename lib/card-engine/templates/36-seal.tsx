import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "burgundy-gold", name: "Burgundy / Gold", tokens: { background: "#2A0A10", surface: "#3E1018", surfaceSecondary: "#521424", text: "#F0E4C0", textSecondary: "#C8A030", textTertiary: "#685010", accent: "#C8A030", accentSecondary: "#E8C050", stampActive: "#C8A030", stampActiveIcon: "#2A0A10", stampInactive: "#521424", border: "#3E1018", borderStrong: "#6A2020", qrBackground: "#F0E4C0", qrForeground: "#2A0A10", rewardBackground: "#3E1018" } },
  { id: "navy-silver", name: "Navy / Silver", tokens: { background: "#080E1C", surface: "#101828", surfaceSecondary: "#1A2438", text: "#E4E8F0", textSecondary: "#9AA8C0", textTertiary: "#485868", accent: "#A8B8D0", accentSecondary: "#C8D8F0", stampActive: "#A8B8D0", stampActiveIcon: "#080E1C", stampInactive: "#1A2438", border: "#182030", borderStrong: "#283850", qrBackground: "#E4E8F0", qrForeground: "#080E1C", rewardBackground: "#101828" } },
  { id: "forest-gold", name: "Forest / Gold", tokens: { background: "#0A1408", surface: "#141E10", surfaceSecondary: "#1E2C18", text: "#F0E8C0", textSecondary: "#C0A830", textTertiary: "#605010", accent: "#C0A830", accentSecondary: "#E0C850", stampActive: "#C0A830", stampActiveIcon: "#0A1408", stampInactive: "#1E2C18", border: "#182410", borderStrong: "#2C3C18", qrBackground: "#F0E8C0", qrForeground: "#0A1408", rewardBackground: "#141E10" } },
];

const template: CardTemplate = {
  id: "36-seal", name: "SEAL", subtitle: "Premium Badge",
  description: "Grand badge central, sceau de qualité, récompense au centre.",
  categories: ["luxury", "premium", "coffee"],
  palettes, defaultPaletteId: "burgundy-gold",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 16 : (dims?.logoSize ?? 28);
    const fmtV = dims?.format === "compact" ? 0.68 : dims?.format === "wide" ? 0.52 : 1;
    const pct = (filled / data.objectif_tampons) * 100;
    const r = thumbnail ? 22 : 42;
    const circ = 2 * Math.PI * r;

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Ornement — luxury opacity 0.04 */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.01) 3px, rgba(255,255,255,0.01) 6px)` }}/>

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

        {/* BADGE CENTRAL avec anneau de progression */}
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
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={(r + 8) * 2} height={(r + 8) * 2} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                <circle cx={r + 8} cy={r + 8} r={r} fill="none" stroke={tokens.border} strokeWidth={thumbnail ? 2.5 : 4}/>
                <circle cx={r + 8} cy={r + 8} r={r} fill="none" stroke={tokens.accent} strokeWidth={thumbnail ? 2.5 : 4} strokeDasharray={`${circ * pct / 100} ${circ}`} strokeLinecap="round"/>
              </svg>
              <div style={{ width: r * 1.5, height: r * 1.5, borderRadius: "50%", background: tokens.surface, border: `1px solid ${tokens.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: thumbnail ? 12 : 22, fontWeight: 700, color: tokens.accent, lineHeight: 1 }}>{filled}</div>
                <div style={{ fontSize: thumbnail ? 4 : ss(6), color: tokens.textTertiary }}>{data.objectif_tampons} tampons</div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>{data.nom_recompense}</div>
          </div>
          <div style={{ background: `${tokens.accent}15`, backdropFilter: "blur(8px)", borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px", border: `1px solid ${tokens.accent}20` }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, lineHeight: 1, color: tokens.accent }}>{filled}/{data.objectif_tampons}</span>
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
