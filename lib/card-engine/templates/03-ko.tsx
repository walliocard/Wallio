import type { CardTemplate, CardPalette } from "../types";
import { renderStrip } from "../strip";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  {
    id: "offwhite-ink", name: "Off White / Ink",
    tokens: {
      background: "#F5F3EE", surface: "#E8E5DE", surfaceSecondary: "#D8D4CB",
      text: "#1A1810", textSecondary: "#4A4840", textTertiary: "#9A9888",
      accent: "#1A1810", accentSecondary: "#4A4840",
      stampActive: "#1A1810", stampActiveIcon: "#F5F3EE", stampInactive: "#D8D4CB",
      border: "#D8D4CB", borderStrong: "#C0BDB4",
      qrBackground: "#FFFFFF", qrForeground: "#1A1810",
      rewardBackground: "#E8E5DE",
    },
  },
  {
    id: "sand-indigo", name: "Sand / Indigo",
    tokens: {
      background: "#F0E8D8", surface: "#E0D4BE", surfaceSecondary: "#C8BCA8",
      text: "#1E1A38", textSecondary: "#3C3870", textTertiary: "#8C88A0",
      accent: "#2C2860", accentSecondary: "#5C58A0",
      stampActive: "#2C2860", stampActiveIcon: "#F0E8D8", stampInactive: "#C8BCA8",
      border: "#C8BCA8", borderStrong: "#B0A890",
      qrBackground: "#FFFFFF", qrForeground: "#1E1A38",
      rewardBackground: "#E0D4BE",
    },
  },
  {
    id: "charcoal-red", name: "Charcoal / Red",
    tokens: {
      background: "#2A2824", surface: "#3A3830", surfaceSecondary: "#4A4840",
      text: "#F0EEE8", textSecondary: "#D0CEC8", textTertiary: "#808078",
      accent: "#C8352A", accentSecondary: "#E04840",
      stampActive: "#C8352A", stampActiveIcon: "#F0EEE8", stampInactive: "#4A4840",
      border: "#3A3830", borderStrong: "#5A5850",
      qrBackground: "#F0EEE8", qrForeground: "#2A2824",
      rewardBackground: "#3A3830",
    },
  },
];

const template: CardTemplate = {
  id: "03-ko",
  name: "KŌ",
  subtitle: "Japanese Minimal",
  description: "Asymétrie, espace vide, sceaux discrets. Minimalisme japonais.",
  categories: ["minimal", "artistic", "modern"],
  palettes,
  defaultPaletteId: "offwhite-ink",
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
        <div style={{ position: "absolute", left: "14%", top: "10%", bottom: "10%", width: "0.5px", background: tokens.border, opacity: 0.7 }}/>
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
        {/* Ligne verticale gauche — élément décoratif japonais subtil */}
        <div style={{
          position: "absolute", left: "14%", top: "10%", bottom: "10%",
          width: "0.5px", background: tokens.border, opacity: 0.7,
        }}/>

        {/* Zone gauche étroite */}
        <div style={{
          width: "14%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          {!thumbnail && (
            <div style={{
              writingMode: "vertical-rl", fontSize: 6, letterSpacing: "0.22em",
              color: tokens.textTertiary, transform: "rotate(180deg)", opacity: 0.7,
            }}>
              FIDÉLITÉ
            </div>
          )}
        </div>

        {/* Zone principale */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          justifyContent: "space-between", padding: thumbnail ? "7% 7% 7% 4%" : "8% 8% 8% 5%",
        }}>
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(12), fontWeight: 600, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>
                {data.nom || "Établissement"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>
                  {data.slogan}
                </div>
              )}
            </div>
            {/* Symbole circulaire KŌ */}
            <div style={{
              width: thumbnail ? 14 : logoSz, height: thumbnail ? 14 : logoSz,
              borderRadius: "50%", border: `1px solid ${tokens.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <div style={{ width: thumbnail ? 5 : 8, height: thumbnail ? 5 : 8, borderRadius: "50%", background: tokens.accent }}/>
            </div>
          </div>

          {/* TAMPONS — dots subtils */}
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
              style={(dims?.stampStyle ?? "dot")} tokens={tokens}
              size={thumbnail ? 6 : 11} gap={thumbnail ? 3 : 5} perRow={10}
            />
          )}

          {/* FOOTER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
                Récompense
              </div>
              {!thumbnail && (
                <div style={{ fontSize: rs(10), fontWeight: 600, color: tokens.text }}>
                  {data.nom_recompense}
                </div>
              )}
            </div>
            <div style={{
              background: `${tokens.accent}12`,
              borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
              border: `1px solid ${tokens.accent}20`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: thumbnail ? 5 : ss(10), fontWeight: 700, color: tokens.accent }}>
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
