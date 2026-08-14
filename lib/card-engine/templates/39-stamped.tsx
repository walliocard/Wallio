import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";

const palettes: CardPalette[] = [
  { id: "kraft-black", name: "Kraft / Black", tokens: { background: "#E8D8A8", surface: "#D8C890", surfaceSecondary: "#C8B878", text: "#0A0804", textSecondary: "#2A2010", textTertiary: "#6A5830", accent: "#0A0804", accentSecondary: "#2A2010", stampActive: "#0A0804", stampActiveIcon: "#E8D8A8", stampInactive: "#D8C890", border: "#C0A858", borderStrong: "#A08838", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#D8C890" } },
  { id: "cream-forest", name: "Cream / Forest", tokens: { background: "#F5F0E4", surface: "#E8E0CC", surfaceSecondary: "#D8D0B4", text: "#0A1008", textSecondary: "#2A4020", textTertiary: "#7A8860", accent: "#1E3818", accentSecondary: "#2E5428", stampActive: "#1E3818", stampActiveIcon: "#F5F0E4", stampInactive: "#D8D0B4", border: "#C8C0A4", borderStrong: "#A8A080", qrBackground: "#FFFFFF", qrForeground: "#0A1008", rewardBackground: "#E8E0CC" } },
  { id: "terracotta-navy", name: "Terracotta / Navy", tokens: { background: "#E8D4C0", surface: "#D8C0A8", surfaceSecondary: "#C8AC90", text: "#0A1028", textSecondary: "#1A2848", textTertiary: "#6880A0", accent: "#1A2848", accentSecondary: "#2A3A60", stampActive: "#1A2848", stampActiveIcon: "#E8D4C0", stampInactive: "#C8AC90", border: "#B89870", borderStrong: "#988050", qrBackground: "#FFFFFF", qrForeground: "#0A1028", rewardBackground: "#D8C0A8" } },
];

const template: CardTemplate = {
  id: "39-stamped", name: "STAMPED", subtitle: "Handmade",
  description: "Artisanal, imperfections simulées, marques d'encre, texture papier.",
  categories: ["retro", "coffee", "restaurant"],
  palettes, defaultPaletteId: "kraft-black",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "'Courier New', monospace", position: "relative", overflow: "hidden" }}>
        {/* Texture papier */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, opacity: 0.4 }}/>

        {/* Tampon circulaire en fond — imperfection */}
        <div style={{ position: "absolute", right: thumbnail ? "3%" : "5%", top: "50%", transform: "translateY(-50%) rotate(-8deg)", width: thumbnail ? 35 : 65, height: thumbnail ? 35 : 65, borderRadius: "50%", border: `${thumbnail ? 2 : 3}px solid ${tokens.accent}`, opacity: 0.08 }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "7% 8%" : "8% 9%", position: "relative", zIndex: 1 }}>
          {/* En-tête manuscrit */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.08em", color: tokens.textTertiary, marginBottom: 2 }}>carte de fidélité —</div>
              <div style={{ fontSize: thumbnail ? 8 : 13, fontWeight: 700, color: tokens.text }}>{data.nom || "Artisan"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
            </div>
          </div>

          {/* Tampons encre */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: thumbnail ? 3 : 6 }}>
            {Array.from({ length: data.objectif_tampons }).map((_, i) => {
              const on = i < filled;
              const rotate = (Math.sin(i * 7.3) * 12);
              return (
                <div key={i} style={{ width: thumbnail ? 10 : 18, height: thumbnail ? 10 : 18, borderRadius: "50%", border: `${thumbnail ? 1 : 1.5}px solid ${on ? tokens.accent : tokens.border}`, background: on ? `${tokens.accent}30` : "transparent", flexShrink: 0, transform: `rotate(${rotate}deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {on && <div style={{ width: thumbnail ? 4 : 8, height: thumbnail ? 4 : 8, borderRadius: "50%", background: tokens.accent, opacity: 0.6 }}/>}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 5 : 7, color: tokens.textSecondary }}>{filled}/{data.objectif_tampons} · {data.nom_recompense}</div>
            
          </div>
        </div>
      </div>
    );
  },
};
export default template;
