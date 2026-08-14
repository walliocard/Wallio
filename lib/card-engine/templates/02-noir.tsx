import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  {
    id: "black-gold", name: "Black / Gold",
    tokens: {
      background: "#0D0D0D", surface: "#1A1A1A", surfaceSecondary: "#242424",
      text: "#F0E6CC", textSecondary: "#C6A15B", textTertiary: "#6A5A3A",
      accent: "#C6A15B", accentSecondary: "#E8C87A",
      stampActive: "#C6A15B", stampActiveIcon: "#0D0D0D", stampInactive: "#2A2218",
      border: "#2A2218", borderStrong: "#4A3C22",
      qrBackground: "#F0E6CC", qrForeground: "#0D0D0D",
      rewardBackground: "#1A1A1A",
    },
  },
  {
    id: "black-silver", name: "Black / Silver",
    tokens: {
      background: "#101114", surface: "#1C1E22", surfaceSecondary: "#28292E",
      text: "#E8E8EA", textSecondary: "#BFC3CA", textTertiary: "#60636A",
      accent: "#BFC3CA", accentSecondary: "#DCDFE5",
      stampActive: "#BFC3CA", stampActiveIcon: "#101114", stampInactive: "#242528",
      border: "#28292E", borderStrong: "#3C3E44",
      qrBackground: "#E8E8EA", qrForeground: "#101114",
      rewardBackground: "#1C1E22",
    },
  },
  {
    id: "black-burgundy", name: "Black / Burgundy",
    tokens: {
      background: "#160D10", surface: "#221218", surfaceSecondary: "#2E1820",
      text: "#F0E0E4", textSecondary: "#A83C52", textTertiary: "#5A2030",
      accent: "#A83C52", accentSecondary: "#C4546A",
      stampActive: "#A83C52", stampActiveIcon: "#F0E0E4", stampInactive: "#2E1820",
      border: "#2E1820", borderStrong: "#4A2030",
      qrBackground: "#F0E0E4", qrForeground: "#160D10",
      rewardBackground: "#221218",
    },
  },
];

const template: CardTemplate = {
  id: "02-noir",
  name: "NOIR",
  subtitle: "Dark Luxury",
  description: "Fond noir, accents précieux, typographie serif. Classe absolue.",
  categories: ["luxury", "premium", "modern"],
  palettes,
  defaultPaletteId: "black-gold",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{
        width: "100%", height: "100%", background: tokens.background,
        display: "flex", flexDirection: "column",
        padding: "6% 7%", fontFamily: "Georgia, 'Times New Roman', serif",
        position: "relative", gap: "5%",
      }}>
        {/* Filet doré haut */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${tokens.accent}, transparent)` }}/>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", border: `1px solid ${tokens.accent}` }}/>
            ) : (
              <div style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${tokens.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 11, color: tokens.accent, fontFamily: "Georgia, serif" }}>{(data.nom[0] || "W").toUpperCase()}</span>
              </div>
            )}
            <span style={{ fontSize: thumbnail ? 8 : 12, fontStyle: "italic", color: tokens.text, letterSpacing: 0.5 }}>
              {data.nom || "Établissement"}
            </span>
          </div>
          <span style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.2em", color: tokens.accent }}>
            MEMBER CARD
          </span>
        </div>

        {/* Tampons médaillons */}
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <Stamps
            total={data.objectif_tampons} filled={filled}
            style="ring" tokens={tokens}
            size={thumbnail ? 10 : 18} gap={thumbnail ? 3 : 5} perRow={10}
          />
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.12em", color: tokens.textTertiary, marginBottom: 2 }}>RÉCOMPENSE</div>
            <div style={{ fontSize: thumbnail ? 7 : 10, color: tokens.accent }}>{data.nom_recompense}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
          </div>
          
        </div>

        {/* Filet bas */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${tokens.accent}, transparent)` }}/>
      </div>
    );
  },
};

export default template;
