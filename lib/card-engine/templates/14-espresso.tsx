import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  {
    id: "espresso-cream", name: "Espresso / Cream",
    tokens: {
      background: "#1C0E08", surface: "#2E1A10", surfaceSecondary: "#3E2818",
      text: "#F5ECD8", textSecondary: "#C8A878", textTertiary: "#7A5A3A",
      accent: "#C8A878", accentSecondary: "#E8C898",
      stampActive: "#C8A878", stampActiveIcon: "#1C0E08", stampInactive: "#3E2818",
      border: "#3E2818", borderStrong: "#5A3C22",
      qrBackground: "#F5ECD8", qrForeground: "#1C0E08",
      rewardBackground: "#2E1A10",
    },
  },
  {
    id: "forest-beige", name: "Forest / Beige",
    tokens: {
      background: "#1A2818", surface: "#243620", surfaceSecondary: "#304428",
      text: "#F0EAD8", textSecondary: "#C0B890", textTertiary: "#708060",
      accent: "#C0B890", accentSecondary: "#E0D8A8",
      stampActive: "#C0B890", stampActiveIcon: "#1A2818", stampInactive: "#304428",
      border: "#304428", borderStrong: "#48602A",
      qrBackground: "#F0EAD8", qrForeground: "#1A2818",
      rewardBackground: "#243620",
    },
  },
  {
    id: "burgundy-sand", name: "Burgundy / Sand",
    tokens: {
      background: "#2A0E14", surface: "#3C1820", surfaceSecondary: "#50222C",
      text: "#F5E8D8", textSecondary: "#C8A080", textTertiary: "#785848",
      accent: "#C8A080", accentSecondary: "#E8C0A0",
      stampActive: "#C8A080", stampActiveIcon: "#2A0E14", stampInactive: "#50222C",
      border: "#50222C", borderStrong: "#6A3040",
      qrBackground: "#F5E8D8", qrForeground: "#2A0E14",
      rewardBackground: "#3C1820",
    },
  },
];

const template: CardTemplate = {
  id: "14-espresso",
  name: "ESPRESSO",
  subtitle: "Coffee Specialty",
  description: "Design paquet de café premium. Étiquette, grain, typographie condensée.",
  categories: ["coffee", "premium", "modern"],
  palettes,
  defaultPaletteId: "espresso-cream",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{
        width: "100%", height: "100%", background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Bande accent haut */}
        <div style={{ height: thumbnail ? 3 : 5, background: tokens.accent, flexShrink: 0 }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "4% 6%", gap: "4%" }}>
          {/* Header — logo + nom condensé */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {data.logo_url ? (
                <img src={data.logo_url} alt="" style={{ width: thumbnail ? 14 : 22, height: thumbnail ? 14 : 22, objectFit: "cover", borderRadius: 2, border: `1px solid ${tokens.border}` }}/>
              ) : (
                <div style={{ width: thumbnail ? 14 : 22, height: thumbnail ? 14 : 22, border: `1px solid ${tokens.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: thumbnail ? 7 : 10, fontWeight: 900, color: tokens.accent }}>{(data.nom[0] || "W").toUpperCase()}</span>
                </div>
              )}
              <div>
                <div style={{ fontSize: thumbnail ? 7 : 11, fontWeight: 900, letterSpacing: "0.05em", color: tokens.text, textTransform: "uppercase", lineHeight: 1 }}>
                  {data.nom || "Café"}
                </div>
                {!thumbnail && data.slogan && (
                  <div style={{ fontSize: 7, color: tokens.textTertiary, marginTop: 1 }}>{data.slogan}</div>
                )}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.15em", color: tokens.accent }}>LOYALTY</div>
              <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.15em", color: tokens.textTertiary }}>CARD</div>
            </div>
          </div>

          {/* Grain de café SVG — illustration abstraite */}
          <div style={{ position: "absolute", right: thumbnail ? "4%" : "6%", top: "15%", opacity: 0.08 }}>
            <svg width={thumbnail ? 30 : 55} height={thumbnail ? 40 : 75} viewBox="0 0 55 75" fill="none">
              <ellipse cx="27" cy="37" rx="24" ry="34" stroke={tokens.text} strokeWidth="1.5"/>
              <path d="M27 6 C27 6 10 25 27 37 S27 68 27 68" stroke={tokens.text} strokeWidth="1.5"/>
            </svg>
          </div>

          {/* Tampons grains */}
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <Stamps
              total={data.objectif_tampons} filled={filled}
              style="circle" tokens={tokens}
              size={thumbnail ? 10 : 18} gap={thumbnail ? 3 : 5} perRow={9}
            />
          </div>

          {/* Footer — étiquette */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: `1px solid ${tokens.border}`, paddingTop: "3%",
          }}>
            <div>
              <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.12em", color: tokens.accent }}>NEXT CUP</div>
              <div style={{ fontSize: thumbnail ? 6 : 9, color: tokens.text }}>{data.nom_recompense}</div>
              <div style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textTertiary, marginTop: 2 }}>
                {filled}/{data.objectif_tampons} tampons
              </div>
            </div>
            
          </div>
        </div>

        {/* Bande accent bas */}
        <div style={{ height: thumbnail ? 2 : 3, background: tokens.border, flexShrink: 0 }}/>
      </div>
    );
  },
};

export default template;
