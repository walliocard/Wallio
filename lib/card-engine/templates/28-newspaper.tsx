import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "paper-black", name: "Paper / Black", tokens: { background: "#F4EED8", surface: "#E8DEC0", surfaceSecondary: "#D8CCA8", text: "#0A0804", textSecondary: "#2A2010", textTertiary: "#6A6048", accent: "#0A0804", accentSecondary: "#2A2010", stampActive: "#0A0804", stampActiveIcon: "#F4EED8", stampInactive: "#D8CCA8", border: "#C0B088", borderStrong: "#A09068", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#E8DEC0" } },
  { id: "paper-burgundy", name: "Paper / Burgundy", tokens: { background: "#F5F0E4", surface: "#EAE0C8", surfaceSecondary: "#D8CCA8", text: "#0A0804", textSecondary: "#6A1828", textTertiary: "#A07860", accent: "#7A1020", accentSecondary: "#A82030", stampActive: "#7A1020", stampActiveIcon: "#F5F0E4", stampInactive: "#D8CCA8", border: "#C8B888", borderStrong: "#A89870", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#EAE0C8" } },
  { id: "paper-navy", name: "Paper / Navy", tokens: { background: "#F2EEE0", surface: "#E4DCC8", surfaceSecondary: "#D4C8A8", text: "#0A0804", textSecondary: "#0E2040", textTertiary: "#6880A0", accent: "#0A1E3E", accentSecondary: "#1A3060", stampActive: "#0A1E3E", stampActiveIcon: "#F2EEE0", stampInactive: "#D4C8A8", border: "#C8BA88", borderStrong: "#A89A68", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#E4DCC8" } },
];

const template: CardTemplate = {
  id: "28-newspaper", name: "NEWSPAPER", subtitle: "Editorial Retro",
  description: "Journal, colonnes, serif, typographie historique. Aspect presse ancienne.",
  categories: ["retro", "editorial", "artistic"],
  palettes, defaultPaletteId: "paper-black",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 16 : (dims?.logoSize ?? 28);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "Georgia, 'Times New Roman', serif", position: "relative", overflow: "hidden" }}>
        {/* En-tête journal */}
        <div style={{ borderBottom: `${thumbnail ? 1.5 : 2.5}px solid ${tokens.text}`, borderTop: `${thumbnail ? 0.5 : 1}px solid ${tokens.text}`, padding: thumbnail ? "2px 5%" : "3px 6%", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: thumbnail ? 5 : 8, letterSpacing: "0.08em", color: tokens.textTertiary }}>Vol. I</div>
            <div style={{ fontSize: thumbnail ? 7 : ns(12), fontWeight: 700, color: tokens.text, fontStyle: "italic" }}>{data.nom || "La Gazette"}</div>
            <div style={{ fontSize: thumbnail ? 5 : 7, color: tokens.textTertiary }}>WALLIO</div>
          </div>
          {data.slogan && !thumbnail && <div style={{ fontSize: 7, color: tokens.textTertiary, textAlign: "center", paddingBottom: 2, fontStyle: "italic" }}>{data.slogan}</div>}
        </div>

        {/* Corps — colonnes */}
        <div style={{ flex: 1, display: "flex", padding: thumbnail ? "3% 4%" : "4% 5%", gap: thumbnail ? 4 : 8 }}>
          {/* Colonne 1 */}
          <div style={{ flex: 2, display: "flex", flexDirection: "column", justifyContent: "space-between", borderRight: `0.5px solid ${tokens.border}`, paddingRight: thumbnail ? 4 : 8 }}>
            <div>
              <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.1em", color: tokens.accent, fontWeight: 700 }}>PROGRAMME</div>
              <div style={{ fontSize: thumbnail ? 5 : 7, fontStyle: "italic", color: tokens.textSecondary, lineHeight: 1.4, marginTop: 2 }}>
                {data.nom_recompense}
              </div>
            </div>
            <div>
              <div style={{ fontSize: thumbnail ? 4 : 5, color: tokens.textTertiary, marginBottom: thumbnail ? 2 : 4 }}>TAMPONS</div>
              <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined} total={data.objectif_tampons} filled={filled} style="dot" tokens={tokens} size={thumbnail ? 5 : 9} gap={thumbnail ? 2 : 3} perRow={9}/>
            </div>
            <div style={{ fontSize: thumbnail ? 4 : ss(6), color: tokens.textTertiary }}>{filled}/{data.objectif_tampons} tampons</div>
          </div>

          {/* Colonne 2 — score */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: thumbnail ? 2 : 4 }}>
            <div style={{ fontSize: thumbnail ? 5 : 8, letterSpacing: "0.1em", color: tokens.textTertiary, textAlign: "center" }}>POINTS</div>
            <div style={{ fontSize: thumbnail ? 12 : 22, fontWeight: 900, color: tokens.text, lineHeight: 1 }}>{filled}</div>
            <div style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textTertiary }}>sur {data.objectif_tampons}</div>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
