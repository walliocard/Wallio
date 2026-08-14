import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";

const palettes: CardPalette[] = [
  { id: "black-lime", name: "Black / Lime", tokens: { background: "#080A06", surface: "#101408", surfaceSecondary: "#181E0C", text: "#FFFFFF", textSecondary: "#B8FF20", textTertiary: "#506010", accent: "#B8FF20", accentSecondary: "#D8FF60", stampActive: "#B8FF20", stampActiveIcon: "#080A06", stampInactive: "#181E0C", border: "#1A2008", borderStrong: "#283010", qrBackground: "#FFFFFF", qrForeground: "#080A06", rewardBackground: "#101408" } },
  { id: "navy-orange", name: "Navy / Orange", tokens: { background: "#080C1A", surface: "#101422", surfaceSecondary: "#182030", text: "#FFFFFF", textSecondary: "#FF7820", textTertiary: "#504018", accent: "#FF7820", accentSecondary: "#FF9840", stampActive: "#FF7820", stampActiveIcon: "#080C1A", stampInactive: "#182030", border: "#18203A", borderStrong: "#283050", qrBackground: "#FFFFFF", qrForeground: "#080C1A", rewardBackground: "#101422" } },
  { id: "white-cobalt", name: "White / Cobalt", tokens: { background: "#F8F8FC", surface: "#ECEDFA", surfaceSecondary: "#D8DAEF", text: "#0A0C1A", textSecondary: "#1A20A0", textTertiary: "#6870C0", accent: "#1428CC", accentSecondary: "#2038EE", stampActive: "#1428CC", stampActiveIcon: "#F8F8FC", stampInactive: "#D8DAEF", border: "#D0D4EC", borderStrong: "#B0B8DC", qrBackground: "#FFFFFF", qrForeground: "#0A0C1A", rewardBackground: "#ECEDFA" } },
];

const template: CardTemplate = {
  id: "43-athletic", name: "ATHLETIC", subtitle: "Sport Performance",
  description: "Dynamique, chiffres géants, barres de progression, énergie pure.",
  categories: ["sport", "modern", "street"],
  palettes, defaultPaletteId: "black-lime",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const pct = Math.round((filled / data.objectif_tampons) * 100);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", position: "relative", fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif", overflow: "hidden" }}>
        {/* Bande diagonale accent */}
        <div style={{ position: "absolute", top: 0, right: thumbnail ? "25%" : "30%", width: thumbnail ? 2 : 4, height: "100%", background: tokens.accent, transform: "skewX(-10deg)", opacity: 0.4 }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: thumbnail ? 7 : 10, fontWeight: 900, color: tokens.text, textTransform: "uppercase", letterSpacing: 1 }}>{data.nom || "ATHLETIC"}</span>
            <span style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.1em", color: tokens.textTertiary }}>WALLIO</span>
          </div>

          {/* % géant */}
          <div style={{ display: "flex", alignItems: "baseline", gap: thumbnail ? 3 : 6 }}>
            <span style={{ fontSize: thumbnail ? 28 : 52, fontWeight: 900, color: tokens.accent, lineHeight: 1 }}>{pct}</span>
            <span style={{ fontSize: thumbnail ? 10 : 18, fontWeight: 900, color: tokens.textTertiary }}>%</span>
          </div>

          {/* Barres de progression */}
          <div style={{ display: "flex", flexDirection: "column", gap: thumbnail ? 2 : 4 }}>
            {Array.from({ length: Math.min(data.objectif_tampons, 10) }).map((_, i) => {
              const on = i < filled;
              return (
                <div key={i} style={{ height: thumbnail ? 2 : 4, borderRadius: 2, background: on ? tokens.accent : tokens.stampInactive, width: on ? "100%" : `${60 + Math.random() * 30}%`, transition: "width 0.3s ease" }}/>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textTertiary }}>{filled}/{data.objectif_tampons} — {data.nom_recompense.toUpperCase()}</div>
            {!thumbnail && <QRBox size={28} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={0}/>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
