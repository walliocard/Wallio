import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "purple-lime", name: "Purple / Lime", tokens: { background: "#1A0830", surface: "#2E1050", surfaceSecondary: "#3E1870", text: "#FFFFFF", textSecondary: "#C0FF40", textTertiary: "#8060A0", accent: "#C0FF40", accentSecondary: "#A8E030", stampActive: "#C0FF40", stampActiveIcon: "#1A0830", stampInactive: "#3E1870", border: "#4A2080", borderStrong: "#6030A0", qrBackground: "#FFFFFF", qrForeground: "#1A0830", rewardBackground: "#2E1050" } },
  { id: "blue-orange", name: "Blue / Orange", tokens: { background: "#0A0E28", surface: "#141A40", surfaceSecondary: "#1E2858", text: "#FFFFFF", textSecondary: "#FF8020", textTertiary: "#405080", accent: "#FF8020", accentSecondary: "#FFA040", stampActive: "#FF8020", stampActiveIcon: "#0A0E28", stampInactive: "#1E2858", border: "#283060", borderStrong: "#3840A0", qrBackground: "#FFFFFF", qrForeground: "#0A0E28", rewardBackground: "#141A40" } },
  { id: "pink-red", name: "Pink / Red", tokens: { background: "#20080E", surface: "#340C16", surfaceSecondary: "#481020", text: "#FFFFFF", textSecondary: "#FF60A0", textTertiary: "#601830", accent: "#FF60A0", accentSecondary: "#FF3060", stampActive: "#FF60A0", stampActiveIcon: "#20080E", stampInactive: "#481020", border: "#5A1428", borderStrong: "#801C38", qrBackground: "#FFFFFF", qrForeground: "#20080E", rewardBackground: "#340C16" } },
];

const template: CardTemplate = {
  id: "10-club90", name: "CLUB 90", subtitle: "90s Retro",
  description: "Années 90, typographie bold, géométries colorées, étoiles.",
  categories: ["retro", "colorful", "street"],
  palettes, defaultPaletteId: "purple-lime",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 16 : (dims?.logoSize ?? 28);
    const fmtV = dims?.format === "compact" ? 0.68 : dims?.format === "wide" ? 0.52 : 1;

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Formes géométriques 90s — très subtiles */}
        <div style={{ position: "absolute", top: thumbnail ? -8 : -15, right: thumbnail ? -8 : -15, width: thumbnail ? 30 : 180, height: thumbnail ? 30 : 180, borderRadius: "50%", background: tokens.accent, opacity: 0.15 }}/>
        <div style={{ position: "absolute", bottom: thumbnail ? 15 : 30, left: thumbnail ? -5 : -10, width: thumbnail ? 20 : 40, height: thumbnail ? 20 : 40, background: tokens.accentSecondary, opacity: 0.1, transform: "rotate(45deg)" }}/>

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "6% 7% 3%" : `${7*fmtV}% 8% ${4*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{
                width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: thumbnail ? 5 : 8,
                background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 900, color: tokens.stampActiveIcon }}>
                  {(data.nom[0] || "W").toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 900, color: tokens.text, letterSpacing: -0.3, textTransform: "uppercase", lineHeight: 1.2 }}>
                {data.nom || "CLUB"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>
                  {data.slogan}
                </div>
              )}
            </div>
          </div>
          {/* Badge ★ WALLIO ★ */}
          <div style={{
            background: `${tokens.accent}20`, backdropFilter: "blur(8px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: `1px solid ${tokens.accent}35`, flexShrink: 0,
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.08em", color: tokens.accent }}>★ WALLIO ★</span>
          </div>
        </div>

        {/* TAMPONS — étoiles 90s */}
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
            style={(dims?.stampStyle ?? "star")} tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 5} perRow={9}
          />
        </div>
          )}

        {/* FOOTER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
              Récompense
            </div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 700, color: tokens.textSecondary }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}20`, backdropFilter: "blur(8px)",
            borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: `1px solid ${tokens.accent}30`,
          }}>
            <span style={{ fontSize: thumbnail ? 7 : ss(13), fontWeight: 900, color: tokens.accent }}>
              {filled}/{data.objectif_tampons}
            </span>
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
