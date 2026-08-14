import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  {
    id: "black-white-red", name: "Black / White / Red",
    tokens: {
      background: "#0A0A0A", surface: "#1A1A1A", surfaceSecondary: "#2A2A2A",
      text: "#FFFFFF", textSecondary: "#AAAAAA", textTertiary: "#555555",
      accent: "#FF2222", accentSecondary: "#FF5555",
      stampActive: "#FFFFFF", stampActiveIcon: "#0A0A0A", stampInactive: "#2A2A2A",
      border: "#2A2A2A", borderStrong: "#444444",
      qrBackground: "#FFFFFF", qrForeground: "#0A0A0A",
      rewardBackground: "#1A1A1A",
    },
  },
  {
    id: "black-yellow", name: "Black / Yellow",
    tokens: {
      background: "#0C0C08", surface: "#1C1C10", surfaceSecondary: "#2C2C18",
      text: "#FFEF00", textSecondary: "#C8C000", textTertiary: "#606000",
      accent: "#FFEF00", accentSecondary: "#FFF380",
      stampActive: "#FFEF00", stampActiveIcon: "#0C0C08", stampInactive: "#2C2C18",
      border: "#2C2C18", borderStrong: "#3C3C20",
      qrBackground: "#FFFFFF", qrForeground: "#0C0C08",
      rewardBackground: "#1C1C10",
    },
  },
  {
    id: "white-cobalt", name: "White / Cobalt",
    tokens: {
      background: "#F8F8F8", surface: "#EEEEEE", surfaceSecondary: "#DDDDDD",
      text: "#0A0A0A", textSecondary: "#404040", textTertiary: "#909090",
      accent: "#0033CC", accentSecondary: "#0055FF",
      stampActive: "#0033CC", stampActiveIcon: "#FFFFFF", stampInactive: "#DDDDDD",
      border: "#DDDDDD", borderStrong: "#BBBBBB",
      qrBackground: "#FFFFFF", qrForeground: "#0A0A0A",
      rewardBackground: "#EEEEEE",
    },
  },
];

const template: CardTemplate = {
  id: "09-raw",
  name: "RAW",
  subtitle: "Brutalist",
  description: "Typographie massive, grille brute, asymétrie assumée. Anti-design.",
  categories: ["street", "editorial", "colorful"],
  palettes,
  defaultPaletteId: "black-white-red",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{
        width: "100%", height: "100%", background: tokens.background,
        display: "flex", position: "relative",
        fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
        overflow: "hidden",
      }}>
        {/* Numéro géant en fond */}
        <div style={{
          position: "absolute", right: thumbnail ? "-2%" : "-3%", bottom: "-5%",
          fontSize: thumbnail ? 60 : 120, fontWeight: 900, color: tokens.surface,
          lineHeight: 1, userSelect: "none",
        }}>
          {filled}
        </div>

        {/* Barre verticale accent */}
        <div style={{
          width: thumbnail ? 4 : 8, background: tokens.accent, flexShrink: 0,
        }}/>

        {/* Contenu */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "5% 5%", justifyContent: "space-between" }}>
          {/* Haut */}
          <div>
            <div style={{ fontSize: thumbnail ? 5 : 7, fontWeight: 900, letterSpacing: "0.15em", color: tokens.accent, marginBottom: 3 }}>
              CARTE DE FIDÉLITÉ
            </div>
            <div style={{ fontSize: thumbnail ? 9 : 15, fontWeight: 900, textTransform: "uppercase", color: tokens.text, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              {data.nom || "ÉTABLISSEMENT"}
            </div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
          </div>

          {/* Tampons carrés */}
          <Stamps
            total={data.objectif_tampons} filled={filled}
            style="square" tokens={tokens}
            size={thumbnail ? 8 : 15} gap={thumbnail ? 2 : 3} perRow={9}
          />

          {/* Bas */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 7 : 11, fontWeight: 900, color: tokens.text }}>
                {filled}<span style={{ color: tokens.textTertiary }}>/{data.objectif_tampons}</span>
              </div>
              <div style={{ fontSize: thumbnail ? 5 : 7, color: tokens.textSecondary, marginTop: 2 }}>
                {data.nom_recompense}
              </div>
            </div>
            {!thumbnail && (
              <QRBox size={36} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={0}/>
            )}
          </div>
        </div>
      </div>
    );
  },
};

export default template;
