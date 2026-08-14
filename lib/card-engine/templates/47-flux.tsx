import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "blue-purple", name: "Blue / Purple", tokens: { background: "#080820", surface: "rgba(255,255,255,0.08)", surfaceSecondary: "rgba(255,255,255,0.04)", text: "#FFFFFF", textSecondary: "#A080FF", textTertiary: "#504080", accent: "#6060FF", accentSecondary: "#A060FF", stampActive: "#FFFFFF", stampActiveIcon: "#080820", stampInactive: "rgba(255,255,255,0.12)", border: "rgba(255,255,255,0.1)", borderStrong: "rgba(255,255,255,0.18)", qrBackground: "#FFFFFF", qrForeground: "#080820", rewardBackground: "rgba(255,255,255,0.06)" } },
  { id: "pink-orange", name: "Pink / Orange", tokens: { background: "#1A0810", surface: "rgba(255,255,255,0.08)", surfaceSecondary: "rgba(255,255,255,0.04)", text: "#FFFFFF", textSecondary: "#FF8080", textTertiary: "#804040", accent: "#FF4060", accentSecondary: "#FF8040", stampActive: "#FFFFFF", stampActiveIcon: "#1A0810", stampInactive: "rgba(255,255,255,0.12)", border: "rgba(255,255,255,0.1)", borderStrong: "rgba(255,255,255,0.18)", qrBackground: "#FFFFFF", qrForeground: "#1A0810", rewardBackground: "rgba(255,255,255,0.06)" } },
  { id: "green-blue", name: "Green / Blue", tokens: { background: "#041410", surface: "rgba(255,255,255,0.08)", surfaceSecondary: "rgba(255,255,255,0.04)", text: "#FFFFFF", textSecondary: "#40E080", textTertiary: "#205040", accent: "#20C060", accentSecondary: "#20A0C0", stampActive: "#FFFFFF", stampActiveIcon: "#041410", stampInactive: "rgba(255,255,255,0.12)", border: "rgba(255,255,255,0.1)", borderStrong: "rgba(255,255,255,0.18)", qrBackground: "#FFFFFF", qrForeground: "#041410", rewardBackground: "rgba(255,255,255,0.06)" } },
];

const template: CardTemplate = {
  id: "47-flux", name: "FLUX", subtitle: "Abstract Digital",
  description: "Formes abstraites fluides, gradient sophistiqué, surface translucide.",
  categories: ["modern", "colorful", "premium"],
  palettes, defaultPaletteId: "blue-purple",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "-apple-system, sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Formes fluides SVG */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 375 246" preserveAspectRatio="none">
          <defs>
            <radialGradient id={`fg-${thumbnail}`} cx="70%" cy="30%">
              <stop offset="0%" stopColor={tokens.accent} stopOpacity="0.35"/>
              <stop offset="100%" stopColor={tokens.accentSecondary} stopOpacity="0"/>
            </radialGradient>
            <radialGradient id={`fg2-${thumbnail}`} cx="20%" cy="80%">
              <stop offset="0%" stopColor={tokens.accentSecondary} stopOpacity="0.2"/>
              <stop offset="100%" stopColor={tokens.accent} stopOpacity="0"/>
            </radialGradient>
          </defs>
          <path d="M200 -30 C300 20 350 100 280 180 C210 260 100 230 50 160 C0 90 40 10 200 -30Z" fill={`url(#fg-${thumbnail})`}/>
          <path d="M-30 120 C20 60 100 30 150 80 C200 130 180 220 100 240 C20 260 -80 180 -30 120Z" fill={`url(#fg2-${thumbnail})`}/>
        </svg>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: thumbnail ? 8 : 13, fontWeight: 600, color: tokens.text }}>{data.nom || "FLUX"}</span>
            <span style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.12em", color: tokens.textTertiary }}>WALLIO</span>
          </div>

          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="dot" tokens={tokens} size={thumbnail ? 7 : 13} gap={thumbnail ? 3 : 5} perRow={10}/>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ background: tokens.surface, backdropFilter: "blur(10px)", borderRadius: thumbnail ? 6 : 10, padding: thumbnail ? "2px 6px" : "4px 10px", border: `1px solid ${tokens.border}` }}>
              <div style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textTertiary }}>REWARD</div>
              <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.text }}>{data.nom_recompense} · {filled}/{data.objectif_tampons}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
            </div>
            
          </div>
        </div>
      </div>
    );
  },
};
export default template;
