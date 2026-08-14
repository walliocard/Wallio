import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "black-cream", name: "Black / Cream", tokens: { background: "#0C0A08", surface: "#1A1614", surfaceSecondary: "#2A2420", text: "#F0E8D8", textSecondary: "#C0A878", textTertiary: "#6A5A3A", accent: "#C0A878", accentSecondary: "#E0C898", stampActive: "#F0E8D8", stampActiveIcon: "#0C0A08", stampInactive: "#2A2420", border: "#2A2420", borderStrong: "#3A3028", qrBackground: "#F0E8D8", qrForeground: "#0C0A08", rewardBackground: "#1A1614" } },
  { id: "orange-black", name: "Orange / Black", tokens: { background: "#1A0A00", surface: "#2A1400", surfaceSecondary: "#3A2000", text: "#FFFFFF", textSecondary: "#FF8020", textTertiary: "#804010", accent: "#FF8020", accentSecondary: "#FFA040", stampActive: "#FF8020", stampActiveIcon: "#1A0A00", stampInactive: "#3A2000", border: "#402000", borderStrong: "#604000", qrBackground: "#FFFFFF", qrForeground: "#1A0A00", rewardBackground: "#2A1400" } },
  { id: "olive-cream", name: "Olive / Cream", tokens: { background: "#141810", surface: "#20261A", surfaceSecondary: "#2C3422", text: "#F0EAD8", textSecondary: "#A0AA78", textTertiary: "#505A30", accent: "#A0AA78", accentSecondary: "#C0CA98", stampActive: "#F0EAD8", stampActiveIcon: "#141810", stampInactive: "#2C3422", border: "#2C3422", borderStrong: "#404E2A", qrBackground: "#F0EAD8", qrForeground: "#141810", rewardBackground: "#20261A" } },
];

const template: CardTemplate = {
  id: "15-roast", name: "ROAST", subtitle: "Coffee Roastery",
  description: "Design industriel, numéro de roast, étiquette produit artisanale.",
  categories: ["coffee", "street", "editorial"],
  palettes, defaultPaletteId: "black-cream",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const roastNum = String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", fontFamily: "'Helvetica Neue', Arial, sans-serif", overflow: "hidden" }}>
        {/* Bande latérale gauche */}
        <div style={{ width: thumbnail ? 14 : 24, background: tokens.surface, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "8% 0", flexShrink: 0, borderRight: `1px solid ${tokens.border}` }}>
          <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: thumbnail ? 4 : 6, letterSpacing: "0.15em", color: tokens.textTertiary }}>WALLIO</div>
          <div style={{ width: thumbnail ? 5 : 8, height: thumbnail ? 5 : 8, borderRadius: "50%", border: `1px solid ${tokens.accent}` }}/>
          <div style={{ writingMode: "vertical-rl", fontSize: thumbnail ? 4 : 6, letterSpacing: "0.12em", color: tokens.accent }}>#{roastNum}</div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 5%" : "7% 6%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.18em", color: tokens.textTertiary, marginBottom: 2 }}>ROASTERY</div>
              <div style={{ fontSize: thumbnail ? 9 : 15, fontWeight: 900, color: tokens.text, textTransform: "uppercase", letterSpacing: -0.5 }}>{data.nom || "Roast"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
            </div>
            {!thumbnail && data.logo_url && <img src={data.logo_url} alt="" style={{ width: 24, height: 24, objectFit: "cover", borderRadius: 2 }}/>}
          </div>

          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined} total={data.objectif_tampons} filled={filled} style="circle" tokens={tokens} size={thumbnail ? 9 : 16} gap={thumbnail ? 3 : 4} perRow={9}/>

          <div style={{ borderTop: `1px solid ${tokens.border}`, paddingTop: thumbnail ? 4 : 7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.1em", color: tokens.textTertiary }}>REWARD</div>
                <div style={{ fontSize: thumbnail ? 6 : 9, color: tokens.textSecondary }}>{data.nom_recompense}</div>
              </div>
              <div style={{ fontSize: thumbnail ? 6 : 10, fontWeight: 700, color: tokens.textSecondary }}>{filled}/{data.objectif_tampons}</div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
