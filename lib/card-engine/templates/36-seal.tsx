import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

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
    const pct = (filled / data.objectif_tampons) * 100;
    const r = thumbnail ? 22 : 42;
    const circ = 2 * Math.PI * r;
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "Georgia, serif", position: "relative", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "5% 6%" : "6% 7%", alignItems: "center" }}>
          {/* Header */}
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 6 : 9, fontStyle: "italic", color: tokens.text }}>{data.nom || "Seal"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400 }}>{data.slogan}</div>}
            </div>
            <div style={{ fontSize: thumbnail ? 3 : 5, letterSpacing: "0.15em", color: tokens.textTertiary }}>WALLIO</div>
          </div>

          {/* Badge central avec anneau de progression */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={(r + 8) * 2} height={(r + 8) * 2} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
              <circle cx={r + 8} cy={r + 8} r={r} fill="none" stroke={tokens.border} strokeWidth={thumbnail ? 2.5 : 4}/>
              <circle cx={r + 8} cy={r + 8} r={r} fill="none" stroke={tokens.accent} strokeWidth={thumbnail ? 2.5 : 4} strokeDasharray={`${circ * pct / 100} ${circ}`} strokeLinecap="round"/>
            </svg>
            <div style={{ width: r * 1.5, height: r * 1.5, borderRadius: "50%", background: tokens.surface, border: `1px solid ${tokens.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: thumbnail ? 12 : 22, fontWeight: 700, color: tokens.accent, lineHeight: 1 }}>{filled}</div>
              <div style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textTertiary }}>{data.objectif_tampons} tampons</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 5 : 7, color: tokens.textSecondary, fontStyle: "italic" }}>{data.nom_recompense}</div>
            <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.1em", color: tokens.textTertiary }}>REWARD</div>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
