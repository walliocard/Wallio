import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "navy-gold", name: "Navy / Gold", tokens: { background: "#0A1428", surface: "#16203A", surfaceSecondary: "#202E50", text: "#F0E8C0", textSecondary: "#C0A030", textTertiary: "#504820", accent: "#C0A030", accentSecondary: "#E0C050", stampActive: "#C0A030", stampActiveIcon: "#0A1428", stampInactive: "#202E50", border: "#2A3850", borderStrong: "#4A5870", qrBackground: "#F0E8C0", qrForeground: "#0A1428", rewardBackground: "#16203A" } },
  { id: "black-silver", name: "Black / Silver", tokens: { background: "#0A0A0C", surface: "#161618", surfaceSecondary: "#222224", text: "#E0E0E4", textSecondary: "#A0A0A8", textTertiary: "#505058", accent: "#C0C0C8", accentSecondary: "#E0E0E8", stampActive: "#C0C0C8", stampActiveIcon: "#0A0A0C", stampInactive: "#222224", border: "#282828", borderStrong: "#383840", qrBackground: "#E0E0E4", qrForeground: "#0A0A0C", rewardBackground: "#161618" } },
  { id: "forest-cream", name: "Forest / Cream", tokens: { background: "#0E1A0C", surface: "#182814", surfaceSecondary: "#22381E", text: "#F0EAD4", textSecondary: "#C0B880", textTertiary: "#506040", accent: "#C0B880", accentSecondary: "#E0D8A0", stampActive: "#C0B880", stampActiveIcon: "#0E1A0C", stampInactive: "#22381E", border: "#2A3820", borderStrong: "#405030", qrBackground: "#F0EAD4", qrForeground: "#0E1A0C", rewardBackground: "#182814" } },
];

const template: CardTemplate = {
  id: "35-signature", name: "SIGNATURE", subtitle: "Monogram",
  description: "Initiales géantes en arrière-plan, monogramme comme motif principal.",
  categories: ["luxury", "premium", "editorial"],
  palettes, defaultPaletteId: "navy-gold",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const initials = (data.nom || "WL").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "Georgia, serif", position: "relative", overflow: "hidden" }}>
        {/* Monogramme géant en fond */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <span style={{ fontSize: thumbnail ? 70 : 130, fontWeight: 700, color: tokens.accent, opacity: 0.07, fontStyle: "italic", letterSpacing: -5, userSelect: "none" }}>{initials}</span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              {data.logo_url ? (
                <img src={data.logo_url} alt="" style={{ width: thumbnail ? 14 : 22, height: thumbnail ? 14 : 22, borderRadius: "50%", objectFit: "cover", border: `1px solid ${tokens.accent}`, marginBottom: 3 }}/>
              ) : (
                <div style={{ width: thumbnail ? 16 : 26, height: thumbnail ? 16 : 26, borderRadius: "50%", border: `1px solid ${tokens.accent}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 3 }}>
                  <span style={{ fontSize: thumbnail ? 7 : 11, color: tokens.accent, fontStyle: "italic" }}>{initials[0]}</span>
                </div>
              )}
              <div style={{ fontSize: thumbnail ? 6 : 9, fontStyle: "italic", color: tokens.text }}>{data.nom || "Signature"}</div>
            </div>
            <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.15em", color: tokens.textTertiary }}>WALLIO</div>
          </div>

          <Stamps total={data.objectif_tampons} filled={filled} style="diamond" tokens={tokens} size={thumbnail ? 8 : 14} gap={thumbnail ? 3 : 6} perRow={9}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 5 : 7, color: tokens.textSecondary, fontStyle: "italic" }}>{data.nom_recompense} · {filled}/{data.objectif_tampons}</div>
            {!thumbnail && <QRBox size={28} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={0}/>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
