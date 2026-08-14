import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";

const palettes: CardPalette[] = [
  { id: "black-neon", name: "Black / Neon Green", tokens: { background: "#04080A", surface: "#0C1214", surfaceSecondary: "#141E20", text: "#00FF80", textSecondary: "#00BB60", textTertiary: "#005530", accent: "#00FF80", accentSecondary: "#80FFC0", stampActive: "#00FF80", stampActiveIcon: "#04080A", stampInactive: "#141E20", border: "#0C2018", borderStrong: "#183828", qrBackground: "#FFFFFF", qrForeground: "#04080A", rewardBackground: "#0C1214" } },
  { id: "white-electric", name: "White / Electric Blue", tokens: { background: "#F8F9FF", surface: "#ECEEFF", surfaceSecondary: "#D8DBFF", text: "#04081A", textSecondary: "#1428CC", textTertiary: "#6878D0", accent: "#1428CC", accentSecondary: "#2040FF", stampActive: "#1428CC", stampActiveIcon: "#F8F9FF", stampInactive: "#D8DBFF", border: "#D0D4F0", borderStrong: "#B0B8E8", qrBackground: "#FFFFFF", qrForeground: "#04081A", rewardBackground: "#ECEEFF" } },
  { id: "grey-orange", name: "Grey / Orange", tokens: { background: "#1A1A1C", surface: "#242428", surfaceSecondary: "#2E2E34", text: "#FFFFFF", textSecondary: "#FF6820", textTertiary: "#605040", accent: "#FF6820", accentSecondary: "#FF8840", stampActive: "#FF6820", stampActiveIcon: "#1A1A1C", stampInactive: "#2E2E34", border: "#282830", borderStrong: "#383840", qrBackground: "#FFFFFF", qrForeground: "#1A1A1C", rewardBackground: "#242428" } },
];

const template: CardTemplate = {
  id: "44-run", name: "RUN", subtitle: "Running / Fitness",
  description: "Interface sport, checkpoints, statistiques, progression visuelle.",
  categories: ["sport", "modern", "minimal"],
  palettes, defaultPaletteId: "black-neon",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "'Courier New', monospace", position: "relative", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 7%" : "7% 8%" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textTertiary }}>{">"} {(data.nom || "RUNNER").toUpperCase()}</div>
              <div style={{ fontSize: thumbnail ? 6 : 9, color: tokens.accent, fontWeight: 700 }}>LOYALTY RUN</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textTertiary }}>WALLIO</div>
            </div>
          </div>

          {/* Checkpoints */}
          <div>
            <div style={{ fontSize: thumbnail ? 4 : 5, color: tokens.textTertiary, marginBottom: thumbnail ? 3 : 6 }}>CHECKPOINTS [{filled}/{data.objectif_tampons}]</div>
            <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 2 : 3 }}>
              {Array.from({ length: data.objectif_tampons }).map((_, i) => {
                const on = i < filled;
                return (
                  <div key={i} style={{ flex: 1, height: thumbnail ? 3 : 5, background: on ? tokens.accent : tokens.stampInactive, borderRadius: 1 }}/>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: thumbnail ? 8 : 16 }}>
            {[
              { label: "DONE", val: filled },
              { label: "LEFT", val: data.objectif_tampons - filled },
              { label: "PCT", val: `${Math.round(filled / data.objectif_tampons * 100)}%` },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.accent }}>{s.val}</div>
                <div style={{ fontSize: thumbnail ? 3 : 5, color: tokens.textTertiary }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: thumbnail ? 4 : 6, color: tokens.textTertiary }}>REWARD: {data.nom_recompense.toUpperCase()}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
            {!thumbnail && <div style={{ background: "#fff", padding: 2, borderRadius: 2 }}><QRBox size={26} bg="#fff" fg={tokens.background} radius={0}/></div>}
          </div>
        </div>
      </div>
    );
  },
};
export default template;
