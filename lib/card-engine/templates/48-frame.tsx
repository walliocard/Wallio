import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  {
    id: "cream-black", name: "Cream / Black",
    tokens: {
      background: "#F8F5EE", surface: "#EDE8DC", surfaceSecondary: "#DED8C8",
      text: "#0A0A0A", textSecondary: "#3A3A3A", textTertiary: "#8A8A8A",
      accent: "#0A0A0A", accentSecondary: "#3A3A3A",
      stampActive: "#0A0A0A", stampActiveIcon: "#F8F5EE", stampInactive: "#DED8C8",
      border: "#C8C0B0", borderStrong: "#A8A090",
      qrBackground: "#FFFFFF", qrForeground: "#0A0A0A",
      rewardBackground: "#EDE8DC",
    },
  },
  {
    id: "black-white", name: "Black / White",
    tokens: {
      background: "#0A0A0A", surface: "#1A1A1A", surfaceSecondary: "#2A2A2A",
      text: "#FFFFFF", textSecondary: "#AAAAAA", textTertiary: "#555555",
      accent: "#FFFFFF", accentSecondary: "#AAAAAA",
      stampActive: "#FFFFFF", stampActiveIcon: "#0A0A0A", stampInactive: "#2A2A2A",
      border: "#3A3A3A", borderStrong: "#4A4A4A",
      qrBackground: "#FFFFFF", qrForeground: "#0A0A0A",
      rewardBackground: "#1A1A1A",
    },
  },
  {
    id: "sage-forest", name: "Sage / Forest",
    tokens: {
      background: "#EDF2ED", surface: "#DDE8DD", surfaceSecondary: "#CCDACC",
      text: "#1A2E1A", textSecondary: "#3A5A3A", textTertiary: "#7A9A7A",
      accent: "#1A2E1A", accentSecondary: "#3A5A3A",
      stampActive: "#1A2E1A", stampActiveIcon: "#EDF2ED", stampInactive: "#CCDACC",
      border: "#B8CCBA", borderStrong: "#98AE9A",
      qrBackground: "#FFFFFF", qrForeground: "#1A2E1A",
      rewardBackground: "#DDE8DD",
    },
  },
];

const template: CardTemplate = {
  id: "48-frame",
  name: "FRAME",
  subtitle: "Ultra Minimal Frame",
  description: "Cadre fin, contenu centré, espaces parfaits. Sophistication absolue.",
  categories: ["minimal", "premium", "luxury"],
  palettes,
  defaultPaletteId: "cream-black",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const frameW = thumbnail ? 1 : 1.5;
    const frameMargin = thumbnail ? "4%" : "5%";
    return (
      <div style={{
        width: "100%", height: "100%", background: tokens.background,
        display: "flex", alignItems: "stretch", justifyContent: "stretch",
        padding: frameMargin,
        fontFamily: "-apple-system, 'Helvetica Neue', sans-serif",
      }}>
        {/* Cadre intérieur */}
        <div style={{
          flex: 1, border: `${frameW}px solid ${tokens.border}`,
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: thumbnail ? "4% 5%" : "5% 6%", position: "relative",
        }}>
          {/* Coins décoratifs */}
          {[
            { top: -frameW, left: -frameW, borderTop: `${frameW*2.5}px solid ${tokens.borderStrong}`, borderLeft: `${frameW*2.5}px solid ${tokens.borderStrong}` },
            { top: -frameW, right: -frameW, borderTop: `${frameW*2.5}px solid ${tokens.borderStrong}`, borderRight: `${frameW*2.5}px solid ${tokens.borderStrong}` },
            { bottom: -frameW, left: -frameW, borderBottom: `${frameW*2.5}px solid ${tokens.borderStrong}`, borderLeft: `${frameW*2.5}px solid ${tokens.borderStrong}` },
            { bottom: -frameW, right: -frameW, borderBottom: `${frameW*2.5}px solid ${tokens.borderStrong}`, borderRight: `${frameW*2.5}px solid ${tokens.borderStrong}` },
          ].map((style, i) => (
            <div key={i} style={{ position: "absolute", width: thumbnail ? 8 : 14, height: thumbnail ? 8 : 14, ...style }}/>
          ))}

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
              {data.logo_url ? (
                <img src={data.logo_url} alt="" style={{ width: thumbnail ? 14 : 22, height: thumbnail ? 14 : 22, objectFit: "cover" }}/>
              ) : null}
              <div>
                <span style={{ fontSize: thumbnail ? 7 : 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: tokens.text }}>
                  {data.nom || "Établissement"}
                </span>
                {data.slogan && !thumbnail && <div style={{ fontSize: 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
              </div>
            </div>
            <span style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.2em", color: tokens.textTertiary }}>WALLIO</span>
          </div>

          {/* Tampons */}
          <Stamps fillWidth={!thumbnail}
            total={data.objectif_tampons} filled={filled}
            style="circle" tokens={tokens}
            size={thumbnail ? 10 : 18} gap={thumbnail ? 3 : 5} perRow={9}
          />

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.1em", color: tokens.textTertiary }}>
                {data.nom_recompense}
              </div>
              <div style={{ fontSize: thumbnail ? 6 : 9, fontWeight: 500, color: tokens.textSecondary, marginTop: 2 }}>
                {filled} / {data.objectif_tampons}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    );
  },
};

export default template;
