import type { CardTemplate, CardPalette } from "../types";
import { renderStrip } from "../strip";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "black-cream", name: "Black / Cream", tokens: { background: "#0C0A08", surface: "#1A1614", surfaceSecondary: "#2A2420", text: "#F0E8D8", textSecondary: "#C0A878", textTertiary: "#6A5A3A", accent: "#C0A878", accentSecondary: "#E0C898", stampActive: "#F0E8D8", stampActiveIcon: "#0C0A08", stampInactive: "#2A2420", border: "#2A2420", borderStrong: "#3A3028", qrBackground: "#F0E8D8", qrForeground: "#0C0A08", rewardBackground: "#1A1614" } },
  { id: "orange-black", name: "Orange / Black", tokens: { background: "#1A0A00", surface: "#2A1400", surfaceSecondary: "#3A2000", text: "#FFFFFF", textSecondary: "#FF8020", textTertiary: "#804010", accent: "#FF8020", accentSecondary: "#FFA040", stampActive: "#FF8020", stampActiveIcon: "#1A0A00", stampInactive: "#3A2000", border: "#402000", borderStrong: "#604000", qrBackground: "#FFFFFF", qrForeground: "#1A0A00", rewardBackground: "#2A1400" } },
  { id: "olive-cream", name: "Olive / Cream", tokens: { background: "#141810", surface: "#20261A", surfaceSecondary: "#2C3422", text: "#F0EAD8", textSecondary: "#A0AA78", textTertiary: "#505A30", accent: "#A0AA78", accentSecondary: "#C0CA98", stampActive: "#F0EAD8", stampActiveIcon: "#141810", stampInactive: "#2C3422", border: "#2C3422", borderStrong: "#404E2A", qrBackground: "#F0EAD8", qrForeground: "#141810", rewardBackground: "#20261A" } },
];

const template: CardTemplate = {
  id: "15-roast", name: "ROAST", subtitle: "Coffee Roastery",
  description: "Design industriel, numéro de roast, étiquette produit artisanale.",
  categories: ["coffee", "street", "editorial"],
  palettes, defaultPaletteId: "black-cream",
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
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: logoSz, background: tokens.surface, borderRight: `1px solid ${tokens.border}`, flexShrink: 0 }}/>
      ),
    });

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Bande latérale gauche — style roastery industriel */}
        <div style={{
          width: thumbnail ? 14 : logoSz, background: tokens.surface,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "space-between", padding: "8% 0", flexShrink: 0,
          borderRight: `1px solid ${tokens.border}`,
        }}>
          <div style={{
            writingMode: "vertical-rl", transform: "rotate(180deg)",
            fontSize: thumbnail ? 4 : 6, letterSpacing: "0.12em", color: tokens.textTertiary,
          }}>WALLIO</div>
          <div style={{
            width: thumbnail ? 5 : 8, height: thumbnail ? 5 : 8, borderRadius: "50%",
            border: `1px solid ${tokens.accent}50`,
          }}/>
          <div style={{
            writingMode: "vertical-rl", fontSize: thumbnail ? 4 : 6,
            letterSpacing: "0.1em", color: tokens.accent, opacity: 0.7,
          }}>ROAST</div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "6% 5%" : "7% 6%", position: "relative", zIndex: 1 }}>
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.16em", color: tokens.textTertiary, marginBottom: 2, textTransform: "uppercase" }}>ROASTERY</div>
              <div style={{ fontSize: thumbnail ? 9 : ns(16), fontWeight: 900, color: tokens.text, letterSpacing: -0.5, textTransform: "uppercase", lineHeight: 1 }}>
                {data.nom || "Roast"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 3 }}>
                  {data.slogan}
                </div>
              )}
            </div>
            {data.logo_url && !thumbnail && (
              <img src={data.logo_url} alt="" style={{ width: 24, height: 24, objectFit: "cover", borderRadius: thumbnail ? 5 : 8 }}/>
            )}
          </div>

          {/* TAMPONS */}
          {data.mode === "progressif" && data.paliers ? (
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
          ) : (
            <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
              total={data.objectif_tampons} filled={filled}
              style={(dims?.stampStyle ?? "circle")} tokens={tokens}
              size={thumbnail ? 8 : 18} gap={thumbnail ? 3 : 4} perRow={9}
            />
          )}

          {/* FOOTER */}
          <div style={{
            borderTop: `1px solid ${tokens.border}`,
            paddingTop: thumbnail ? 4 : 7,
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          }}>
            <div>
              <div style={{ fontSize: thumbnail ? 4 : rs(6), letterSpacing: "0.08em", color: tokens.accent, textTransform: "uppercase", marginBottom: 2 }}>REWARD</div>
              <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.textSecondary }}>
                {data.nom_recompense}
              </div>
            </div>
            <div style={{
              background: `${tokens.accent}18`, backdropFilter: "blur(8px)",
              borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
              border: `1px solid ${tokens.accent}28`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, lineHeight: 1, color: tokens.accent }}>
                {filled}/{data.objectif_tampons}
              </span>
              </div>

              {!thumbnail && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 5, letterSpacing: "0.12em", color: tokens.textTertiary, textTransform: "uppercase" as const, marginBottom: 1 }}>Titulaire</div>
                  <div style={{ fontSize: ss(9), fontWeight: 600, color: tokens.text }}>
                    {data.client_prenom ? `${data.client_prenom} ${data.client_nom || ""}`.trim() : "Prénom Nom"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
