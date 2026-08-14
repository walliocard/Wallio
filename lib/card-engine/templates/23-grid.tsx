import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";

const palettes: CardPalette[] = [
  { id: "black-green", name: "Black / Green", tokens: { background: "#020804", surface: "#080E08", surfaceSecondary: "#0C1610", text: "#00CC44", textSecondary: "#00882E", textTertiary: "#004418", accent: "#00CC44", accentSecondary: "#00FF66", stampActive: "#00CC44", stampActiveIcon: "#020804", stampInactive: "#0C1610", border: "#0C1C0C", borderStrong: "#183818", qrBackground: "#FFFFFF", qrForeground: "#020804", rewardBackground: "#080E08" } },
  { id: "white-blue", name: "White / Blue", tokens: { background: "#F0F4F8", surface: "#E0E8F0", surfaceSecondary: "#D0DCE8", text: "#0A1428", textSecondary: "#0840A0", textTertiary: "#6080B8", accent: "#0840A0", accentSecondary: "#1060D0", stampActive: "#0840A0", stampActiveIcon: "#F0F4F8", stampInactive: "#D0DCE8", border: "#C0D0E0", borderStrong: "#9AB0C8", qrBackground: "#FFFFFF", qrForeground: "#0A1428", rewardBackground: "#E0E8F0" } },
  { id: "dark-purple", name: "Dark / Purple", tokens: { background: "#060410", surface: "#0C0820", surfaceSecondary: "#140C30", text: "#C080FF", textSecondary: "#8040C0", textTertiary: "#40206080", accent: "#C080FF", accentSecondary: "#E0A0FF", stampActive: "#C080FF", stampActiveIcon: "#060410", stampInactive: "#140C30", border: "#1C1040", borderStrong: "#301860", qrBackground: "#FFFFFF", qrForeground: "#060410", rewardBackground: "#0C0820" } },
];

const template: CardTemplate = {
  id: "23-grid", name: "GRID", subtitle: "Tech",
  description: "Interface digitale, police monospace, données, grille, terminal.",
  categories: ["modern", "editorial", "street"],
  palettes, defaultPaletteId: "black-green",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const ts = new Date().toISOString().slice(0, 10);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "'Courier New', Courier, monospace", position: "relative", overflow: "hidden" }}>
        {/* Lignes grille */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${tokens.border} 1px, transparent 1px)`, backgroundSize: `100% ${thumbnail ? 14 : 24}px`, opacity: 0.4 }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "5% 6%" : "6% 7%", position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textTertiary }}>{">"} WALLIO_LOYALTY v2.0</div>
            <div style={{ fontSize: thumbnail ? 5 : 7, color: tokens.textSecondary, marginTop: 1 }}>ID: {(data.nom || "USER").toUpperCase().replace(/ /g, "_")}</div>
            {data.slogan && !thumbnail && <div style={{ fontSize: 7, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic" }}># {data.slogan}</div>}
          </div>

          <div>
            <div style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textTertiary, marginBottom: thumbnail ? 3 : 5 }}>STAMPS [{filled}/{data.objectif_tampons}]</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: thumbnail ? 2 : 4 }}>
              {Array.from({ length: data.objectif_tampons }).map((_, i) => (
                <span key={i} style={{ fontSize: thumbnail ? 5 : 8, color: i < filled ? tokens.accent : tokens.textTertiary, fontFamily: "monospace" }}>
                  {i < filled ? "█" : "░"}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textTertiary }}>REWARD: {data.nom_recompense.toUpperCase()}</div>
              {!thumbnail && <div style={{ fontSize: 6, color: tokens.textTertiary, marginTop: 2 }}>{ts}</div>}
            </div>
            <div style={{ fontSize: thumbnail ? 5 : 7, fontWeight: 700, color: tokens.accent }}>{filled}/{data.objectif_tampons}</div>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
