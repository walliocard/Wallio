import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";

const palettes: CardPalette[] = [
  { id: "black-green", name: "Black / Green", tokens: { background: "#080808", surface: "#101010", surfaceSecondary: "#181818", text: "#00FF41", textSecondary: "#00AA2C", textTertiary: "#005516", accent: "#00FF41", accentSecondary: "#00CC33", stampActive: "#00FF41", stampActiveIcon: "#080808", stampInactive: "#181818", border: "#181818", borderStrong: "#282828", qrBackground: "#FFFFFF", qrForeground: "#080808", rewardBackground: "#101010" } },
  { id: "navy-cyan", name: "Navy / Cyan", tokens: { background: "#040A18", surface: "#080E22", surfaceSecondary: "#0C1430", text: "#00E5FF", textSecondary: "#0090B0", textTertiary: "#004458", accent: "#00E5FF", accentSecondary: "#00AABB", stampActive: "#00E5FF", stampActiveIcon: "#040A18", stampInactive: "#0C1430", border: "#0C1A30", borderStrong: "#183050", qrBackground: "#FFFFFF", qrForeground: "#040A18", rewardBackground: "#080E22" } },
  { id: "purple-pink", name: "Purple / Pink", tokens: { background: "#100816", surface: "#180C20", surfaceSecondary: "#20102C", text: "#FF60FF", textSecondary: "#AA30AA", textTertiary: "#551555", accent: "#FF60FF", accentSecondary: "#FF40AA", stampActive: "#FF60FF", stampActiveIcon: "#100816", stampInactive: "#20102C", border: "#241038", borderStrong: "#381848", qrBackground: "#FFFFFF", qrForeground: "#100816", rewardBackground: "#180C20" } },
];

const template: CardTemplate = {
  id: "24-pixel", name: "PIXEL", subtitle: "Digital Retro",
  description: "Pixel art subtil, police digitale, tampons en pixels, rétro-gaming.",
  categories: ["retro", "colorful", "street"],
  palettes, defaultPaletteId: "black-green",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const px = thumbnail ? 3 : 5;
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "'Courier New', monospace", position: "relative", overflow: "hidden", imageRendering: "pixelated" }}>
        {/* Grille pixel */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${tokens.border} 1px, transparent 1px), linear-gradient(90deg, ${tokens.border} 1px, transparent 1px)`, backgroundSize: `${px * 4}px ${px * 4}px`, opacity: 0.3 }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          {/* Header pixel art */}
          <div style={{ display: "flex", gap: 2 }}>
            {["INSERT", "COIN"].map((word, wi) => (
              <div key={wi} style={{ display: "flex", gap: 1 }}>
                {word.split("").map((ch, ci) => (
                  <span key={ci} style={{ fontSize: thumbnail ? 4 : 6, color: tokens.accent, fontFamily: "monospace", letterSpacing: 0 }}>{ch}</span>
                ))}
                <span style={{ width: thumbnail ? 4 : 6 }}/>
              </div>
            ))}
          </div>

          {/* Nom */}
          <div>
            <div style={{ fontSize: thumbnail ? 7 : 11, fontWeight: 700, color: tokens.text, letterSpacing: 2, textTransform: "uppercase" }}>{data.nom || "PLAYER 1"}</div>
            {data.slogan && !thumbnail && <div style={{ fontSize: 7, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
          </div>

          {/* Tampons pixels */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: thumbnail ? 2 : 4 }}>
            {Array.from({ length: data.objectif_tampons }).map((_, i) => {
              const on = i < filled;
              return (
                <div key={i} style={{ width: thumbnail ? 7 : 13, height: thumbnail ? 7 : 13, background: on ? tokens.stampActive : tokens.stampInactive, flexShrink: 0, imageRendering: "pixelated" }}/>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textSecondary }}>{data.nom_recompense.toUpperCase()}</div>
            <div style={{ fontSize: thumbnail ? 5 : 7, fontWeight: 700, color: tokens.accent }}>{filled}P / {data.objectif_tampons}P</div>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
