import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  {
    id: "ivory", name: "Ivory",
    tokens: {
      background: "#F8F7F4", surface: "#EEECEA", surfaceSecondary: "#E4E1DC",
      text: "#171717", textSecondary: "#5A5A5A", textTertiary: "#9A9A9A",
      accent: "#007AFF", accentSecondary: "#BF5AF2",
      stampActive: "#171717", stampActiveIcon: "#F8F7F4", stampInactive: "#DDDAD4",
      border: "#E0DDD8", borderStrong: "#C8C4BE",
      qrBackground: "#FFFFFF", qrForeground: "#171717",
      rewardBackground: "#EEECEA",
    },
  },
  {
    id: "graphite", name: "Graphite",
    tokens: {
      background: "#1C1C1E", surface: "#2C2C2E", surfaceSecondary: "#3A3A3C",
      text: "#FFFFFF", textSecondary: "#AEAEB2", textTertiary: "#636366",
      accent: "#BF5AF2", accentSecondary: "#007AFF",
      stampActive: "#FFFFFF", stampActiveIcon: "#1C1C1E", stampInactive: "#3A3A3C",
      border: "#3A3A3C", borderStrong: "#4A4A4C",
      qrBackground: "#FFFFFF", qrForeground: "#1C1C1E",
      rewardBackground: "#2C2C2E",
    },
  },
  {
    id: "sage", name: "Sage",
    tokens: {
      background: "#EEF3EF", surface: "#E0EAE1", surfaceSecondary: "#D0DFD1",
      text: "#1D2923", textSecondary: "#4A5E50", textTertiary: "#8A9E90",
      accent: "#2D6A4F", accentSecondary: "#52B788",
      stampActive: "#2D6A4F", stampActiveIcon: "#EEF3EF", stampInactive: "#C8D8CA",
      border: "#C8D8CA", borderStrong: "#A8C4AB",
      qrBackground: "#FFFFFF", qrForeground: "#1D2923",
      rewardBackground: "#E0EAE1",
    },
  },
];

const template: CardTemplate = {
  id: "01-aura",
  name: "AURA",
  subtitle: "Minimal Premium",
  description: "Ultra minimaliste, grands espaces, typographie sobre. Inspiré d'Apple.",
  categories: ["minimal", "premium", "modern"],
  palettes,
  defaultPaletteId: "ivory",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const pct = (filled / data.objectif_tampons) * 100;
    return (
      <div style={{
        width: "100%", height: "100%", background: tokens.background,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "6% 7%", fontFamily: "-apple-system, 'SF Pro Display', Inter, sans-serif",
        position: "relative",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover" }}/>
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: 8, background: tokens.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: tokens.text }}>{(data.nom[0] || "W").toUpperCase()}</span>
              </div>
            )}
            <span style={{ fontSize: thumbnail ? 9 : 13, fontWeight: 600, color: tokens.text, letterSpacing: -0.3 }}>
              {data.nom || "Nom établissement"}
            </span>
          </div>
          <span style={{ fontSize: thumbnail ? 6 : 8, fontWeight: 700, letterSpacing: "0.14em", color: tokens.textTertiary }}>
            WALLIO
          </span>
        </div>

        {/* Stamps */}
        <Stamps
          total={data.objectif_tampons} filled={filled}
          style="circle" tokens={tokens}
          size={thumbnail ? 12 : 20} gap={thumbnail ? 3 : 5} perRow={9}
        />

        {/* Progress + reward */}
        <div>
          <div style={{ height: 2, background: tokens.border, borderRadius: 1, marginBottom: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: tokens.stampActive, borderRadius: 1 }}/>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <span style={{ fontSize: thumbnail ? 7 : 10, color: tokens.textTertiary }}>
              {data.nom_recompense || "Récompense"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {!thumbnail && (
                <QRBox size={36} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={4}/>
              )}
              <span style={{ fontSize: thumbnail ? 7 : 10, fontWeight: 600, color: tokens.textSecondary }}>
                {filled}/{data.objectif_tampons}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export default template;
