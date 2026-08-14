import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "sand-black", name: "Sand / Black", tokens: { background: "#E8D8B0", surface: "#D8C498", surfaceSecondary: "#C8B080", text: "#0A0804", textSecondary: "#2A2010", textTertiary: "#6A5830", accent: "#0A0804", accentSecondary: "#2A2010", stampActive: "#0A0804", stampActiveIcon: "#E8D8B0", stampInactive: "#C8B080", border: "#C0A868", borderStrong: "#A08848", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#D8C498" } },
  { id: "terracotta-cream", name: "Terracotta / Cream", tokens: { background: "#F0E0D0", surface: "#E0C8B4", surfaceSecondary: "#D0B098", text: "#1A0808", textSecondary: "#6A2A18", textTertiary: "#AA7050", accent: "#8A3020", accentSecondary: "#B04830", stampActive: "#8A3020", stampActiveIcon: "#F0E0D0", stampInactive: "#D0B098", border: "#C8A080", borderStrong: "#A88060", qrBackground: "#FFFFFF", qrForeground: "#1A0808", rewardBackground: "#E0C8B4" } },
  { id: "olive-sand", name: "Olive / Sand", tokens: { background: "#E8E4CC", surface: "#D8D0AE", surfaceSecondary: "#C8C090", text: "#0E140A", textSecondary: "#3A4020", textTertiary: "#6A7050", accent: "#4A5020", accentSecondary: "#6A7030", stampActive: "#4A5020", stampActiveIcon: "#E8E4CC", stampInactive: "#C8C090", border: "#B8B878", borderStrong: "#989858", qrBackground: "#FFFFFF", qrForeground: "#0E140A", rewardBackground: "#D8D0AE" } },
];

const template: CardTemplate = {
  id: "13-oasis", name: "OASIS", subtitle: "Desert Luxury",
  description: "Beige, sable, architecture désertique. Typographie serif élégante.",
  categories: ["premium", "restaurant", "nature"],
  palettes, defaultPaletteId: "sand-black",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "Georgia, serif", position: "relative", overflow: "hidden" }}>
        {/* Bande de sable en diagonal */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: thumbnail ? "35%" : "38%", background: tokens.surface }}/>
        {/* Transition diagonale */}
        <svg style={{ position: "absolute", top: thumbnail ? "25%" : "28%", left: 0, right: 0 }} width="100%" height={thumbnail ? 18 : 30} viewBox="0 0 375 30" preserveAspectRatio="none">
          <path d="M0 0 L375 15 L375 30 L0 30 Z" fill={tokens.background}/>
          <path d="M0 0 L375 15 L375 16 L0 1 Z" fill={tokens.border} fillOpacity="0.4"/>
        </svg>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "5% 7%" : "6% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              {data.logo_url ? <img src={data.logo_url} alt="" style={{ width: thumbnail ? 14 : 22, height: thumbnail ? 14 : 22, borderRadius: 3, objectFit: "cover" }}/> : null}
              <div style={{ fontSize: thumbnail ? 8 : 13, fontWeight: 700, color: tokens.text, marginTop: 2 }}>{data.nom || "Oasis"}</div>
            </div>
            <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.15em", color: tokens.textTertiary }}>WALLIO</div>
          </div>

          <Stamps total={data.objectif_tampons} filled={filled} style="rounded" tokens={tokens} size={thumbnail ? 8 : 14} gap={thumbnail ? 3 : 5} perRow={9}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, fontStyle: "italic" }}>{data.nom_recompense}</div>
              <div style={{ fontSize: thumbnail ? 6 : 10, fontWeight: 600, color: tokens.text }}>{filled}/{data.objectif_tampons}</div>
            </div>
            {!thumbnail && <div style={{ background: tokens.background, padding: 3, borderRadius: 2 }}><QRBox size={30} bg={tokens.qrBackground} fg={tokens.qrForeground} radius={0}/></div>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
