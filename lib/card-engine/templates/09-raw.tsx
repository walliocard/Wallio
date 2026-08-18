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
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 16 : (dims?.logoSize ?? 28);

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Bande verticale accent — signature RAW */}
        <div style={{
          width: thumbnail ? 4 : logoSz, background: tokens.accent, flexShrink: 0,
        }}/>

        {/* Numéro géant en fond — opacity très subtile */}
        <div style={{
          position: "absolute", right: thumbnail ? "-2%" : "-3%", bottom: "-5%",
          fontSize: thumbnail ? 60 : 120, fontWeight: 900, color: tokens.surface,
          lineHeight: 1, userSelect: "none", pointerEvents: "none",
        }}>
          {filled}
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 5%" : "7% 6%", position: "relative", zIndex: 1 }}>
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 5 : 7, fontWeight: 700, letterSpacing: "0.12em", color: tokens.accent, marginBottom: 3, textTransform: "uppercase" }}>
                FIDÉLITÉ
              </div>
              <div style={{ fontSize: thumbnail ? 9 : ns(16), fontWeight: 900, color: tokens.text, lineHeight: 1.0, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
                {data.nom || "ÉTABLISSEMENT"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 3 }}>
                  {data.slogan}
                </div>
              )}
            </div>
            {/* Badge WALLIO */}
            <div style={{
              background: `${tokens.accent}18`, backdropFilter: "blur(8px)",
              borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
              border: `1px solid ${tokens.accent}30`, flexShrink: 0,
            }}>
              <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: tokens.accent }}>WALLIO</span>
            </div>
          </div>

          {/* TAMPONS — carrés brutaux */}
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style="square" tokens={tokens}
            size={thumbnail ? 8 : 16} gap={thumbnail ? 2 : 3} perRow={9}
          />

          {/* FOOTER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
                Récompense
              </div>
              <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 700, color: tokens.text }}>
                {data.nom_recompense}
              </div>
            </div>
            <div style={{
              background: `${tokens.accent}18`, backdropFilter: "blur(8px)",
              borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
              border: `1px solid ${tokens.accent}30`,
            }}>
              <span style={{ fontSize: thumbnail ? 6 : 12, fontWeight: 900, color: tokens.accent }}>
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
