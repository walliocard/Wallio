import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  {
    id: "offwhite-ink", name: "Off White / Ink",
    tokens: {
      background: "#F5F3EE", surface: "#E8E5DE", surfaceSecondary: "#D8D4CB",
      text: "#1A1810", textSecondary: "#4A4840", textTertiary: "#9A9888",
      accent: "#1A1810", accentSecondary: "#4A4840",
      stampActive: "#1A1810", stampActiveIcon: "#F5F3EE", stampInactive: "#D8D4CB",
      border: "#D8D4CB", borderStrong: "#C0BDB4",
      qrBackground: "#FFFFFF", qrForeground: "#1A1810",
      rewardBackground: "#E8E5DE",
    },
  },
  {
    id: "sand-indigo", name: "Sand / Indigo",
    tokens: {
      background: "#F0E8D8", surface: "#E0D4BE", surfaceSecondary: "#C8BCA8",
      text: "#1E1A38", textSecondary: "#3C3870", textTertiary: "#8C88A0",
      accent: "#2C2860", accentSecondary: "#5C58A0",
      stampActive: "#2C2860", stampActiveIcon: "#F0E8D8", stampInactive: "#C8BCA8",
      border: "#C8BCA8", borderStrong: "#B0A890",
      qrBackground: "#FFFFFF", qrForeground: "#1E1A38",
      rewardBackground: "#E0D4BE",
    },
  },
  {
    id: "charcoal-red", name: "Charcoal / Red",
    tokens: {
      background: "#2A2824", surface: "#3A3830", surfaceSecondary: "#4A4840",
      text: "#F0EEE8", textSecondary: "#D0CEC8", textTertiary: "#808078",
      accent: "#C8352A", accentSecondary: "#E04840",
      stampActive: "#C8352A", stampActiveIcon: "#F0EEE8", stampInactive: "#4A4840",
      border: "#3A3830", borderStrong: "#5A5850",
      qrBackground: "#F0EEE8", qrForeground: "#2A2824",
      rewardBackground: "#3A3830",
    },
  },
];

const template: CardTemplate = {
  id: "03-ko",
  name: "KŌ",
  subtitle: "Japanese Minimal",
  description: "Asymétrie, espace vide, sceaux discrets. Minimalisme japonais.",
  categories: ["minimal", "artistic", "modern"],
  palettes,
  defaultPaletteId: "offwhite-ink",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    return (
      <div style={{
        width: "100%", height: "100%", background: tokens.background,
        display: "flex", position: "relative",
        fontFamily: "-apple-system, 'Helvetica Neue', sans-serif",
      }}>
        {/* Ligne verticale gauche */}
        <div style={{
          position: "absolute", left: "14%", top: "8%", bottom: "8%",
          width: 1, background: tokens.border,
        }}/>

        {/* Zone gauche — étroite */}
        <div style={{
          width: "14%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "8% 0",
        }}>
          {!thumbnail && (
            <div style={{ writingMode: "vertical-rl", fontSize: 7, letterSpacing: "0.25em", color: tokens.textTertiary, transform: "rotate(180deg)" }}>
              FIDÉLITÉ
            </div>
          )}
        </div>

        {/* Zone principale */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          justifyContent: "space-between", padding: "7% 7% 7% 5%",
        }}>
          {/* Nom — grand, haut */}
          <div>
            <div style={{ fontSize: thumbnail ? 7 : 10, letterSpacing: "0.18em", color: tokens.textTertiary, marginBottom: 3 }}>
              {(data.nom || "ÉTABLISSEMENT").toUpperCase()}
            </div>
            {data.slogan && !thumbnail && (
              <div style={{ fontSize: 8, color: tokens.textSecondary, fontStyle: "italic" }}>{data.slogan}</div>
            )}
          </div>

          {/* Sceaux — petits, alignés */}
          <Stamps sizeOverride={!thumbnail ? dims?.stampSize : undefined} total={data.objectif_tampons} filled={filled}
            style="dot" tokens={tokens}
            size={thumbnail ? 6 : 10} gap={thumbnail ? 3 : 5} perRow={10}
          />

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.1em", color: tokens.textTertiary }}>
                {filled} / {data.objectif_tampons}
              </div>
              {!thumbnail && (
                <div style={{ fontSize: 8, color: tokens.textSecondary, marginTop: 2 }}>{data.nom_recompense}</div>
              )}
            </div>
            
          </div>
        </div>

        {/* Symbole circulaire — coin supérieur droit */}
        <div style={{
          position: "absolute", right: "6%", top: "8%",
          width: thumbnail ? 14 : 22, height: thumbnail ? 14 : 22,
          borderRadius: "50%",
          border: `1px solid ${tokens.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: thumbnail ? 5 : 8, height: thumbnail ? 5 : 8, borderRadius: "50%", background: tokens.accent }}/>
        </div>
      </div>
    );
  },
};

export default template;
