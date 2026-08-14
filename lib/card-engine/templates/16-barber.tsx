import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "black-white-red", name: "Black / White / Red", tokens: { background: "#0A0A0A", surface: "#1A1A1A", surfaceSecondary: "#2A2A2A", text: "#FFFFFF", textSecondary: "#CCCCCC", textTertiary: "#666666", accent: "#CC2020", accentSecondary: "#EE3030", stampActive: "#FFFFFF", stampActiveIcon: "#0A0A0A", stampInactive: "#2A2A2A", border: "#2A2A2A", borderStrong: "#CC2020", qrBackground: "#FFFFFF", qrForeground: "#0A0A0A", rewardBackground: "#1A1A1A" } },
  { id: "black-gold", name: "Black / Gold", tokens: { background: "#0D0D0D", surface: "#1A1A14", surfaceSecondary: "#242418", text: "#F0E8C0", textSecondary: "#C0A040", textTertiary: "#605820", accent: "#C0A040", accentSecondary: "#E0C060", stampActive: "#C0A040", stampActiveIcon: "#0D0D0D", stampInactive: "#242418", border: "#282810", borderStrong: "#484820", qrBackground: "#F0E8C0", qrForeground: "#0D0D0D", rewardBackground: "#1A1A14" } },
  { id: "navy-cream", name: "Navy / Cream", tokens: { background: "#0A1428", surface: "#141E3A", surfaceSecondary: "#1E2A4E", text: "#F5EDD8", textSecondary: "#C0B090", textTertiary: "#607090", accent: "#C0B090", accentSecondary: "#E0D0B0", stampActive: "#F5EDD8", stampActiveIcon: "#0A1428", stampInactive: "#1E2A4E", border: "#2A3A54", borderStrong: "#3A4E70", qrBackground: "#F5EDD8", qrForeground: "#0A1428", rewardBackground: "#141E3A" } },
];

const template: CardTemplate = {
  id: "16-barber", name: "BARBER", subtitle: "Modern Barber",
  description: "Barber shop masculin, lignes horizontales, badge, typographie forte.",
  categories: ["barber", "premium", "street"],
  palettes, defaultPaletteId: "black-white-red",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Lignes horizontales décoratives */}
        {[20, 35, 50].map((pct, i) => (
          <div key={i} style={{ position: "absolute", top: `${pct}%`, left: 0, right: 0, height: "1px", background: tokens.border, opacity: i === 1 ? 0.8 : 0.4 }}/>
        ))}
        {/* Bande accent */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: thumbnail ? 3 : 5, background: tokens.accent }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "8% 7%" : "9% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.2em", color: tokens.accent, marginBottom: 2 }}>THE</div>
              <div style={{ fontSize: thumbnail ? 9 : 14, fontWeight: 900, color: tokens.text, textTransform: "uppercase", letterSpacing: 1 }}>{data.nom || "BARBER"}</div>
            </div>
            <div style={{ border: `1px solid ${tokens.borderStrong}`, borderRadius: thumbnail ? 4 : 6, padding: thumbnail ? "2px 5px" : "3px 8px" }}>
              <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.12em", color: tokens.textSecondary }}>LOYALTY</div>
            </div>
          </div>

          <Stamps total={data.objectif_tampons} filled={filled} style="badge" tokens={tokens} size={thumbnail ? 9 : 16} gap={thumbnail ? 3 : 5} perRow={8}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.1em", color: tokens.accent }}>NEXT REWARD</div>
              <div style={{ fontSize: thumbnail ? 6 : 9, color: tokens.text }}>{data.nom_recompense} · {filled}/{data.objectif_tampons}</div>
            </div>
            {!thumbnail && <QRBox size={32} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={0}/>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
