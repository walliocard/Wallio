import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "concrete-black", name: "Concrete / Black", tokens: { background: "#C8C4BE", surface: "#B8B4AE", surfaceSecondary: "#A8A49E", text: "#0A0A0A", textSecondary: "#2A2A2A", textTertiary: "#6A6A6A", accent: "#0A0A0A", accentSecondary: "#2A2A2A", stampActive: "#0A0A0A", stampActiveIcon: "#C8C4BE", stampInactive: "#A8A49E", border: "#989490", borderStrong: "#787470", qrBackground: "#FFFFFF", qrForeground: "#0A0A0A", rewardBackground: "#B8B4AE" } },
  { id: "charcoal-cream", name: "Charcoal / Cream", tokens: { background: "#2C2C2C", surface: "#3C3C3C", surfaceSecondary: "#4C4C4C", text: "#F0EDE8", textSecondary: "#C0BDB8", textTertiary: "#707070", accent: "#F0EDE8", accentSecondary: "#C0BDB8", stampActive: "#F0EDE8", stampActiveIcon: "#2C2C2C", stampInactive: "#4C4C4C", border: "#444444", borderStrong: "#585858", qrBackground: "#F0EDE8", qrForeground: "#2C2C2C", rewardBackground: "#3C3C3C" } },
  { id: "sand-black", name: "Sand / Black", tokens: { background: "#E0D8C8", surface: "#D0C8B4", surfaceSecondary: "#C0B8A0", text: "#0A0804", textSecondary: "#2A2010", textTertiary: "#6A6050", accent: "#0A0804", accentSecondary: "#2A2010", stampActive: "#0A0804", stampActiveIcon: "#E0D8C8", stampInactive: "#C0B8A0", border: "#B0A890", borderStrong: "#908870", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#D0C8B4" } },
];

const template: CardTemplate = {
  id: "20-concrete", name: "CONCRETE", subtitle: "Architectural",
  description: "Béton, grille, géométrie pure. Lignes et numéros comme éléments de design.",
  categories: ["minimal", "editorial", "street"],
  palettes, defaultPaletteId: "concrete-black",
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
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Grille architecturale — opacity très subtile */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(${tokens.border}25 1px, transparent 1px), linear-gradient(90deg, ${tokens.border}25 1px, transparent 1px)`,
          backgroundSize: thumbnail ? "20px 20px" : "36px 36px",
          opacity: 0.5,
        }}/>

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "6% 7% 3%" : "7% 8% 4%",
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{
                width: thumbnail ? 16 : 28, height: thumbnail ? 16 : 28, borderRadius: thumbnail ? 5 : 8,
                background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.stampActiveIcon }}>
                  {(data.nom[0] || "W").toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.16em", color: tokens.textTertiary, textTransform: "uppercase", marginBottom: 2 }}>
                STRUCT
              </div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 700, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>
                {data.nom || "CONCRETE"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>
                  {data.slogan}
                </div>
              )}
            </div>
          </div>
          {/* Numéro dans un rectangle — Liquid Glass */}
          <div style={{
            background: `${tokens.accent}15`, backdropFilter: "blur(8px)",
            borderRadius: 8, padding: thumbnail ? "2px 6px" : "4px 12px",
            border: `1px solid ${tokens.accent}25`, flexShrink: 0,
          }}>
            <span style={{ fontSize: thumbnail ? 9 : 16, fontWeight: 900, color: tokens.accent, lineHeight: 1 }}>{filled}</span>
          </div>
        </div>

        {/* TAMPONS — carrés architecturaux */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style="square" tokens={tokens}
            size={thumbnail ? 8 : 16} gap={thumbnail ? 2 : 4} perRow={9}
          />
        </div>

        {/* FOOTER */}
        <div style={{
          borderTop: `1px solid ${tokens.borderStrong}`, opacity: 0.6,
          padding: thumbnail ? "3% 7% 6%" : "4% 8% 7%",
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2, opacity: 1 }}>
              Récompense
            </div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text, opacity: 1 }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}12`,
            borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: `1px solid ${tokens.accent}20`, opacity: 1,
          }}>
            <span style={{ fontSize: thumbnail ? 6 : 11, fontWeight: 700, color: tokens.accent }}>
              {filled}/{data.objectif_tampons}
            </span>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
