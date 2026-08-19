import type { CardTemplate, CardPalette } from "../types";
import { renderStrip } from "../strip";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

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
  render({ data, tokens, thumbnail, dimensions, strip }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 16 : (dims?.logoSize ?? 28);
    const fmtV = dims?.format === "compact" ? 0.68 : dims?.format === "wide" ? 0.52 : 1;

    if (strip) return renderStrip(data, tokens, {
      decoratives: (
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${tokens.accent}10 1px, transparent 1px), linear-gradient(90deg, ${tokens.accent}10 1px, transparent 1px)`, backgroundSize: "14px 14px" }}/>
      ),
    });

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Grille pixel — retro opacity 0.08 */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(${tokens.accent}10 1px, transparent 1px), linear-gradient(90deg, ${tokens.accent}10 1px, transparent 1px)`,
          backgroundSize: `${thumbnail ? 8 : 14}px ${thumbnail ? 8 : 14}px`,
        }}/>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: thumbnail ? "6% 7% 3%" : `${7*fmtV}% 8% ${4*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: logoSz, height: logoSz, borderRadius: 0, objectFit: "cover" }}/>
            ) : (
              <div style={{ width: logoSz, height: logoSz, background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.stampActiveIcon }}>{(data.nom[0] || "W").toUpperCase()}</span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 700, color: tokens.text, letterSpacing: 1, lineHeight: 1.2 }}>{data.nom || "PLAYER 1"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>{data.slogan}</div>}
            </div>
          </div>
          <div style={{ background: `${tokens.accent}18`, backdropFilter: "blur(8px)", borderRadius: 4, padding: thumbnail ? "1px 5px" : "2px 8px", border: `1px solid ${tokens.accent}30`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", lineHeight: 1, color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS */}
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
            style={(dims?.stampStyle ?? "badge")} tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}/>
        </div>
          )}

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>{data.nom_recompense}</div>
          </div>
          <div style={{ background: `${tokens.accent}15`, backdropFilter: "blur(8px)", borderRadius: 4, padding: thumbnail ? "2px 5px" : "4px 10px", border: `1px solid ${tokens.accent}25` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, lineHeight: 1, color: tokens.accent }}>{filled}/{data.objectif_tampons}</span>
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
