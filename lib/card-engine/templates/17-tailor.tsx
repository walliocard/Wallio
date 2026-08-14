import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "cream-navy", name: "Cream / Navy", tokens: { background: "#F5F0E8", surface: "#E8E0D0", surfaceSecondary: "#D8D0BC", text: "#0E1E3A", textSecondary: "#2A3E6A", textTertiary: "#7A8EAA", accent: "#0E1E3A", accentSecondary: "#2A3E6A", stampActive: "#0E1E3A", stampActiveIcon: "#F5F0E8", stampInactive: "#D8D0BC", border: "#C8C0A8", borderStrong: "#A8A088", qrBackground: "#FFFFFF", qrForeground: "#0E1E3A", rewardBackground: "#E8E0D0" } },
  { id: "black-gold", name: "Black / Gold", tokens: { background: "#0D0D0D", surface: "#1A1A14", surfaceSecondary: "#242418", text: "#F0E8C0", textSecondary: "#C0A040", textTertiary: "#605820", accent: "#C0A040", accentSecondary: "#E0C060", stampActive: "#C0A040", stampActiveIcon: "#0D0D0D", stampInactive: "#242418", border: "#302818", borderStrong: "#504030", qrBackground: "#F0E8C0", qrForeground: "#0D0D0D", rewardBackground: "#1A1A14" } },
  { id: "forest-ivory", name: "Forest / Ivory", tokens: { background: "#0F1E12", surface: "#182A1C", surfaceSecondary: "#213828", text: "#F0EAD8", textSecondary: "#A0B880", textTertiary: "#506040", accent: "#A0B880", accentSecondary: "#C0D8A0", stampActive: "#A0B880", stampActiveIcon: "#0F1E12", stampInactive: "#213828", border: "#2A3C22", borderStrong: "#3A5030", qrBackground: "#F0EAD8", qrForeground: "#0F1E12", rewardBackground: "#182A1C" } },
];

const template: CardTemplate = {
  id: "17-tailor", name: "TAILOR", subtitle: "Old Money",
  description: "Maison de couture, serif élégante, monogramme, boutons comme tampons.",
  categories: ["luxury", "beauty", "premium"],
  palettes, defaultPaletteId: "cream-navy",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "Georgia, 'Times New Roman', serif", position: "relative", overflow: "hidden" }}>
        {/* Double bordure */}
        <div style={{ position: "absolute", inset: thumbnail ? 3 : 5, border: `0.5px solid ${tokens.borderStrong}`, pointerEvents: "none" }}/>
        <div style={{ position: "absolute", inset: thumbnail ? 5 : 9, border: `0.5px solid ${tokens.border}`, pointerEvents: "none" }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "11% 10%" : "13% 12%", position: "relative", zIndex: 1 }}>
          {/* Monogramme */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontSize: thumbnail ? 12 : 22, fontWeight: 700, color: tokens.accent, fontStyle: "italic", letterSpacing: -1 }}>
              {(data.nom || "T").toUpperCase().slice(0, 2)}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.15em", color: tokens.textTertiary }}>MAISON</div>
              <div style={{ fontSize: thumbnail ? 5 : 7, fontStyle: "italic", color: tokens.textSecondary }}>{data.nom || "Tailor"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
            </div>
          </div>

          {/* Tampons boutons */}
          <div style={{ display: "flex", flexDirection: "column", gap: thumbnail ? 3 : 5 }}>
            <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined} total={data.objectif_tampons} filled={filled} style="ring" tokens={tokens} size={thumbnail ? 9 : 16} gap={thumbnail ? 3 : 5} perRow={9}/>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textSecondary, fontStyle: "italic" }}>{data.nom_recompense}</div>
            <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textSecondary }}>{filled}/{data.objectif_tampons}</div>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
