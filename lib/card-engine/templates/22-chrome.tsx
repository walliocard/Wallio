import type { CardTemplate, CardPalette } from "../types";
import { renderStrip } from "../strip";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "chrome-blue", name: "Chrome / Blue", tokens: { background: "#1A1E28", surface: "#252A38", surfaceSecondary: "#303748", text: "#D8DCE8", textSecondary: "#6080C0", textTertiary: "#384868", accent: "#4070E0", accentSecondary: "#60A0FF", stampActive: "#60A0FF", stampActiveIcon: "#1A1E28", stampInactive: "#303748", border: "#2A3050", borderStrong: "#404860", qrBackground: "#FFFFFF", qrForeground: "#1A1E28", rewardBackground: "#252A38" } },
  { id: "chrome-purple", name: "Chrome / Purple", tokens: { background: "#18141E", surface: "#221C2C", surfaceSecondary: "#2E2438", text: "#D8D0E8", textSecondary: "#8050C0", textTertiary: "#402860", accent: "#A060E0", accentSecondary: "#C080FF", stampActive: "#C080FF", stampActiveIcon: "#18141E", stampInactive: "#2E2438", border: "#302048", borderStrong: "#483060", qrBackground: "#FFFFFF", qrForeground: "#18141E", rewardBackground: "#221C2C" } },
  { id: "chrome-green", name: "Chrome / Green", tokens: { background: "#101814", surface: "#18241C", surfaceSecondary: "#203024", text: "#C8DCD0", textSecondary: "#30B870", textTertiary: "#185830", accent: "#20D060", accentSecondary: "#40F080", stampActive: "#40F080", stampActiveIcon: "#101814", stampInactive: "#203024", border: "#184030", borderStrong: "#286050", qrBackground: "#FFFFFF", qrForeground: "#101814", rewardBackground: "#18241C" } },
];

const template: CardTemplate = {
  id: "22-chrome", name: "CHROME", subtitle: "Futuristic",
  description: "Metal chromé, dégradés métalliques, anneaux comme tampons.",
  categories: ["modern", "premium", "street"],
  palettes, defaultPaletteId: "chrome-blue",
  render({ data, tokens, thumbnail, dimensions, strip }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 16 : (dims?.logoSize ?? 28);
    const fmtV = dims?.format === "compact" ? 0.68 : dims?.format === "wide" ? 0.52 : 1;

    if (strip) return renderStrip(data, tokens, {
      background: `linear-gradient(135deg, ${tokens.background} 0%, ${tokens.surface} 50%, ${tokens.background} 100%)`,
      decoratives: (
        <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: "1px", background: `linear-gradient(90deg, transparent, ${tokens.accentSecondary}50, transparent)` }}/>
      ),
    });

    return (
      <div style={{
        width: "100%", height: "100%",
        background: `linear-gradient(135deg, ${tokens.background} 0%, ${tokens.surface} 50%, ${tokens.background} 100%)`,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Reflet métallique haut */}
        <div style={{
          position: "absolute", top: 0, left: "15%", right: "15%",
          height: "1px", background: `linear-gradient(90deg, transparent, ${tokens.accentSecondary}50, transparent)`,
        }}/>

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "6% 7% 3%" : "7% 8% 4%",
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{
                width: thumbnail ? 16 : 28, height: thumbnail ? 16 : 28, borderRadius: "50%",
                background: `radial-gradient(circle at 35% 35%, ${tokens.accentSecondary}, ${tokens.accent})`,
                flexShrink: 0,
              }}/>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 700, color: tokens.text, letterSpacing: -0.3, textTransform: "uppercase", lineHeight: 1.2 }}>
                {data.nom || "CHROME"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>
                  {data.slogan}
                </div>
              )}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}20`, backdropFilter: "blur(10px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: `1px solid ${tokens.accent}35`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", lineHeight: 1, color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS — rings chromés */}
                  {/* Mode progressif */}
          {data.mode === "progressif" && data.paliers ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
              <ProgressiveStamps
                paliers={data.paliers}
                palier_actuel={data.palier_actuel ?? 0}
                paliers_valides={data.paliers_valides ?? []}
                tampons={data.tampons}
                tokens={tokens}
                stampStyle={dims?.stampStyle}
                stampSize={dims?.stampSize}
                thumbnail={thumbnail}
              />
            </div>
          ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style={(dims?.stampStyle ?? "ring")} tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 5} perRow={9}
          />
        </div>
          )}

        {/* FOOTER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: thumbnail ? "3% 7% 6%" : "4% 8% 7%",
          position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>REWARD</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.textSecondary }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}20`, backdropFilter: "blur(10px)",
            borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: `1px solid ${tokens.accent}30`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, lineHeight: 1, color: tokens.accent }}>
              {filled}/{data.objectif_tampons}
            </span>
            </div>
          </div>
        
            {/* Titulaire */}
            {!thumbnail && (
              <div style={{ marginTop: thumbnail ? 3 : 6 }}>
                <div style={{ fontSize: 5, letterSpacing: "0.12em", color: tokens.textTertiary, textTransform: "uppercase" as const, marginBottom: 1 }}>Titulaire</div>
                <div style={{ fontSize: thumbnail ? 5 : ss(9), fontWeight: 600, color: tokens.text }}>
                  {data.client_prenom ? `${data.client_prenom} ${data.client_nom || ""}`.trim() : "Prénom Nom"}
                </div>
              </div>
            )}
            </div>
      </div>
    );
  },
};
export default template;
