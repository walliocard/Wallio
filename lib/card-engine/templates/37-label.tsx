import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "kraft-black", name: "Kraft / Black", tokens: { background: "#C8A060", surface: "#B89050", surfaceSecondary: "#A07840", text: "#0A0804", textSecondary: "#2A2010", textTertiary: "#6A5830", accent: "#0A0804", accentSecondary: "#2A2010", stampActive: "#0A0804", stampActiveIcon: "#C8A060", stampInactive: "#A07840", border: "#A07840", borderStrong: "#806020", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#B89050" } },
  { id: "cream-red", name: "Cream / Red", tokens: { background: "#F5EDDC", surface: "#EAE0C8", surfaceSecondary: "#D8CCA8", text: "#0A0804", textSecondary: "#AA1818", textTertiary: "#8A7848", accent: "#CC1818", accentSecondary: "#EE2828", stampActive: "#CC1818", stampActiveIcon: "#F5EDDC", stampInactive: "#D8CCA8", border: "#C8B888", borderStrong: "#A89868", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#EAE0C8" } },
  { id: "black-cream", name: "Black / Cream", tokens: { background: "#0A0A08", surface: "#141410", surfaceSecondary: "#202018", text: "#F5EDDC", textSecondary: "#C0B080", textTertiary: "#605828", accent: "#F5EDDC", accentSecondary: "#C0B080", stampActive: "#F5EDDC", stampActiveIcon: "#0A0A08", stampInactive: "#202018", border: "#202018", borderStrong: "#302818", qrBackground: "#F5EDDC", qrForeground: "#0A0A08", rewardBackground: "#141410" } },
];

const template: CardTemplate = {
  id: "37-label", name: "LABEL", subtitle: "Packaging",
  description: "Emballage premium, étiquette centrale, informations autour.",
  categories: ["coffee", "restaurant", "editorial"],
  palettes, defaultPaletteId: "kraft-black",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Helvetica Neue', Arial, sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Texture fond */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='transparent'/%3E%3Ccircle cx='1' cy='1' r='0.5' fill='rgba(0,0,0,0.04)'/%3E%3C/svg%3E")`, backgroundSize: "4px 4px" }}/>

        {/* Étiquette centrale */}
        <div style={{ background: tokens.surface, border: `1.5px solid ${tokens.borderStrong}`, padding: thumbnail ? "6% 8%" : "8% 10%", display: "flex", flexDirection: "column", gap: thumbnail ? 4 : 8, alignItems: "center", width: "75%", position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.2em", color: tokens.textTertiary }}>{(data.nom || "LABEL").toUpperCase()}</div>
          <div style={{ height: "0.5px", width: "100%", background: tokens.borderStrong, opacity: 0.5 }}/>
          <Stamps total={data.objectif_tampons} filled={filled} style="rounded" tokens={tokens} size={thumbnail ? 7 : 13} gap={thumbnail ? 2 : 4} perRow={8}/>
          <div style={{ height: "0.5px", width: "100%", background: tokens.borderStrong, opacity: 0.5 }}/>
          <div style={{ fontSize: thumbnail ? 5 : 7, color: tokens.textSecondary, textAlign: "center" }}>{filled}/{data.objectif_tampons} — {data.nom_recompense}</div>
        </div>

        {/* QR coin bas droite */}
        {!thumbnail && (
          <div style={{ position: "absolute", bottom: "6%", right: "6%" }}>
            <QRBox size={28} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={0}/>
          </div>
        )}
        {/* WALLIO watermark */}
        <div style={{ position: "absolute", bottom: "5%", left: "5%", fontSize: thumbnail ? 3 : 5, letterSpacing: "0.15em", color: tokens.textTertiary, opacity: 0.6 }}>WALLIO</div>
      </div>
    );
  },
};
export default template;
