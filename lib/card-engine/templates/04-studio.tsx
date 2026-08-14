import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  {
    id: "white-black-red", name: "White / Black / Red",
    tokens: {
      background: "#FFFFFF", surface: "#F0F0F0", surfaceSecondary: "#E0E0E0",
      text: "#0A0A0A", textSecondary: "#3A3A3A", textTertiary: "#8A8A8A",
      accent: "#D42B2B", accentSecondary: "#FF3B30",
      stampActive: "#0A0A0A", stampActiveIcon: "#FFFFFF", stampInactive: "#E0E0E0",
      border: "#E0E0E0", borderStrong: "#C0C0C0",
      qrBackground: "#FFFFFF", qrForeground: "#0A0A0A",
      rewardBackground: "#F0F0F0",
    },
  },
  {
    id: "cream-navy-orange", name: "Cream / Navy / Orange",
    tokens: {
      background: "#F8F4EC", surface: "#EDE7DA", surfaceSecondary: "#D8D0C0",
      text: "#0E1C38", textSecondary: "#2A3C5E", textTertiary: "#7A8AA0",
      accent: "#E86A10", accentSecondary: "#FF8C30",
      stampActive: "#0E1C38", stampActiveIcon: "#F8F4EC", stampInactive: "#D8D0C0",
      border: "#D8D0C0", borderStrong: "#C0B8A8",
      qrBackground: "#FFFFFF", qrForeground: "#0E1C38",
      rewardBackground: "#EDE7DA",
    },
  },
  {
    id: "black-electric", name: "Black / Electric Blue",
    tokens: {
      background: "#0A0A0C", surface: "#141418", surfaceSecondary: "#1E1E24",
      text: "#FFFFFF", textSecondary: "#A0A8C0", textTertiary: "#505870",
      accent: "#0070FF", accentSecondary: "#40A0FF",
      stampActive: "#0070FF", stampActiveIcon: "#FFFFFF", stampInactive: "#1E1E24",
      border: "#1E1E24", borderStrong: "#2E2E38",
      qrBackground: "#FFFFFF", qrForeground: "#0A0A0C",
      rewardBackground: "#141418",
    },
  },
];

const template: CardTemplate = {
  id: "04-studio",
  name: "STUDIO",
  subtitle: "Swiss Editorial",
  description: "Grille typographique stricte, alignements précis, magazine contemporain.",
  categories: ["editorial", "modern", "minimal"],
  palettes,
  defaultPaletteId: "white-black-red",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    return (
      <div style={{
        width: "100%", height: "100%", background: tokens.background,
        display: "grid",
        gridTemplateColumns: "1fr 3fr",
        gridTemplateRows: "1fr 1fr",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Ligne rouge verticale */}
        <div style={{
          position: "absolute", left: "25%", top: 0, bottom: 0,
          width: thumbnail ? 1.5 : 2.5, background: tokens.accent,
        }}/>
        {/* Ligne horizontale */}
        <div style={{
          position: "absolute", left: 0, right: 0, top: "50%",
          height: thumbnail ? 0.8 : 1, background: tokens.border,
        }}/>

        {/* Case haut-gauche — numéro */}
        <div style={{ padding: "7%", display: "flex", alignItems: "flex-start", justifyContent: "flex-start" }}>
          <span style={{ fontSize: thumbnail ? 14 : 28, fontWeight: 900, color: tokens.accent, lineHeight: 1 }}>
            {filled}
          </span>
        </div>

        {/* Case haut-droite — nom + tampons */}
        <div style={{ padding: "6% 6% 6% 8%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: thumbnail ? 7 : 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: tokens.text }}>
              {data.nom || "ÉTABLISSEMENT"}
            </span>
            {data.slogan && !thumbnail && <div style={{ fontSize: 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
          </div>
          <Stamps sizeOverride={!thumbnail ? dims?.stampSize : undefined} total={data.objectif_tampons} filled={filled}
            style="square" tokens={tokens}
            size={thumbnail ? 7 : 13} gap={thumbnail ? 2 : 4} perRow={9}
          />
        </div>

        {/* Case bas-gauche — récompense */}
        <div style={{ padding: "7%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.14em", color: tokens.textTertiary }}>
            WALLIO
          </span>
        </div>

        {/* Case bas-droite — récompense + score */}
        <div style={{ padding: "6% 6% 6% 8%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.1em", color: tokens.textTertiary, marginBottom: 3 }}>RÉCOMPENSE</div>
            <div style={{ fontSize: thumbnail ? 6 : 9, color: tokens.text, fontWeight: 500 }}>{data.nom_recompense}</div>
          </div>
          <span style={{ fontSize: thumbnail ? 5 : 8, fontWeight: 600, color: tokens.textSecondary }}>{filled}/{data.objectif_tampons}</span>
        </div>
      </div>
    );
  },
};

export default template;
