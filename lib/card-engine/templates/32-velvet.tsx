import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "plum-gold", name: "Plum / Gold", tokens: { background: "#1A0828", surface: "#280A3E", surfaceSecondary: "#381058", text: "#F0E4F8", textSecondary: "#C090E0", textTertiary: "#806090", accent: "#C8A040", accentSecondary: "#E8C060", stampActive: "#C8A040", stampActiveIcon: "#1A0828", stampInactive: "#381058", border: "#2E1040", borderStrong: "#502080", qrBackground: "#F0E4F8", qrForeground: "#1A0828", rewardBackground: "#280A3E" } },
  { id: "midnight-rose", name: "Midnight / Rose", tokens: { background: "#120810", surface: "#201018", surfaceSecondary: "#2E1822", text: "#F4E8F0", textSecondary: "#E090B8", textTertiary: "#906080", accent: "#D06090", accentSecondary: "#F080B0", stampActive: "#D06090", stampActiveIcon: "#120810", stampInactive: "#2E1822", border: "#241018", borderStrong: "#401828", qrBackground: "#F4E8F0", qrForeground: "#120810", rewardBackground: "#201018" } },
  { id: "emerald-cream", name: "Emerald / Cream", tokens: { background: "#0A1A10", surface: "#102018", surfaceSecondary: "#182C20", text: "#F0F0E4", textSecondary: "#80C8A0", textTertiary: "#407050", accent: "#60C080", accentSecondary: "#80E0A0", stampActive: "#60C080", stampActiveIcon: "#0A1A10", stampInactive: "#182C20", border: "#182418", borderStrong: "#2A4030", qrBackground: "#F0F0E4", qrForeground: "#0A1A10", rewardBackground: "#102018" } },
];

const template: CardTemplate = {
  id: "32-velvet", name: "VELVET", subtitle: "Textile Précieux",
  description: "Profondeur velours, reflets doux, typographie fine sur fond sombre dense.",
  categories: ["luxury", "beauty", "premium"],
  palettes, defaultPaletteId: "plum-gold",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "Georgia, serif", position: "relative", overflow: "hidden" }}>
        {/* Texture velours — micro-motif diagonal */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)` }}/>
        {/* Reflet satiné haut */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "35%", background: `linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)` }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              {data.logo_url && <img src={data.logo_url} alt="" style={{ width: thumbnail ? 14 : 22, height: thumbnail ? 14 : 22, borderRadius: "50%", objectFit: "cover", border: `1px solid ${tokens.accent}`, marginBottom: 3 }}/>}
              <div style={{ fontSize: thumbnail ? 7 : 11, fontStyle: "italic", fontWeight: 400, color: tokens.text, letterSpacing: "0.04em" }}>{data.nom || "Velvet"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <div style={{ fontSize: thumbnail ? 3 : 5, letterSpacing: "0.15em", color: tokens.textTertiary }}>WALLIO</div>
              <div style={{ width: thumbnail ? 12 : 22, height: "0.5px", background: tokens.accent, opacity: 0.5 }}/>
            </div>
          </div>

          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined} total={data.objectif_tampons} filled={filled} style="ring" tokens={tokens} size={thumbnail ? 9 : 16} gap={thumbnail ? 3 : 5} perRow={9}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 3 : 5, letterSpacing: "0.12em", color: tokens.textTertiary, marginBottom: 1 }}>RÉCOMPENSE</div>
              <div style={{ fontSize: thumbnail ? 5 : 7, fontStyle: "italic", color: tokens.accent }}>{data.nom_recompense} · {filled}/{data.objectif_tampons}</div>
            </div>
            
          </div>
        </div>
      </div>
    );
  },
};
export default template;
