import type { CardTemplate, CardPalette } from "../types";
import { renderStrip } from "../strip";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  {
    id: "pink-cobalt", name: "Rose / Cobalt",
    tokens: {
      background: "#F5C8D8", surface: "#E8A8BC", surfaceSecondary: "#D888A0",
      text: "#0A1A5A", textSecondary: "#1A3A8A", textTertiary: "#4A6AAA",
      accent: "#1A2E8A", accentSecondary: "#2A40AA",
      stampActive: "#1A2E8A", stampActiveIcon: "#F5C8D8", stampInactive: "#D888A0",
      border: "#C878A0", borderStrong: "#A04878",
      qrBackground: "#F5C8D8", qrForeground: "#0A1A5A",
      rewardBackground: "#E8A8BC",
    },
  },
  {
    id: "yellow-violet", name: "Jaune / Violet",
    tokens: {
      background: "#F8E840", surface: "#E8D820", surfaceSecondary: "#D0C000",
      text: "#1A0840", textSecondary: "#3A1870", textTertiary: "#6A48A0",
      accent: "#3A1070", accentSecondary: "#5A2898",
      stampActive: "#3A1070", stampActiveIcon: "#F8E840", stampInactive: "#D0C000",
      border: "#B89800", borderStrong: "#887000",
      qrBackground: "#F8E840", qrForeground: "#1A0840",
      rewardBackground: "#E8D820",
    },
  },
  {
    id: "coral-teal", name: "Corail / Sarcelle",
    tokens: {
      background: "#FF6B6B", surface: "#EE5050", surfaceSecondary: "#DD3030",
      text: "#FFFFFF", textSecondary: "#FFE0E0", textTertiary: "#FFB8B8",
      accent: "#00C8A8", accentSecondary: "#00A888",
      stampActive: "#FFFFFF", stampActiveIcon: "#FF6B6B", stampInactive: "#EE5050",
      border: "rgba(255,255,255,0.3)", borderStrong: "rgba(255,255,255,0.5)",
      qrBackground: "#FFFFFF", qrForeground: "#FF6B6B",
      rewardBackground: "#EE5050",
    },
  },
];

const template: CardTemplate = {
  id: "53-groovy",
  name: "GROOVY",
  subtitle: "Retro Bold",
  description: "Typographie massive, couleurs vives, tampons grands et ronds. Énergie pop retro.",
  categories: ["colorful", "street", "restaurant", "modern"],
  palettes,
  defaultPaletteId: "pink-cobalt",
  render({ data, tokens, thumbnail, dimensions, strip }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 13 : (dims?.logoSize ?? 22);
    const fmtV = dims?.format === "compact" ? 0.80 : dims?.format === "wide" ? 0.60 : 1;

    if (strip) return renderStrip(data, tokens, {
      decoratives: (
        <div style={{ position: "absolute", right: "-2%", bottom: "12%", fontSize: 80, fontWeight: 900, color: `${tokens.text}08`, lineHeight: 1, letterSpacing: -4, userSelect: "none", pointerEvents: "none", textTransform: "uppercase" as const }}>
          ★
        </div>
      ),
    });

    // Taille du nom : adapté selon la longueur
    const nomLen = (data.nom || "ÉTABLISSEMENT").length;
    const nameFontSize = thumbnail ? 13
      : nomLen <= 6  ? 42
      : nomLen <= 10 ? 34
      : nomLen <= 14 ? 28
      : 22;

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Rounded', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>

        {/* ── Texte décoratif fond — pattern discret ── */}
        {!thumbnail && (
          <div style={{
            position: "absolute", right: "-2%", bottom: "12%",
            fontSize: 80, fontWeight: 900, color: `${tokens.text}08`,
            lineHeight: 1, letterSpacing: -4, userSelect: "none", pointerEvents: "none",
            textTransform: "uppercase",
          }}>
            ★
          </div>
        )}

        {/* ── HEADER COMPACT — logo + WALLIO badge ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: thumbnail ? "5% 6% 1%" : `${5 * fmtV}% 7% ${1 * fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 3 : 6 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: logoSz, height: logoSz, borderRadius: "50%", objectFit: "cover", border: `2px solid ${tokens.accent}` }}/>
            ) : (
              <div style={{
                width: logoSz, height: logoSz, borderRadius: "50%",
                background: tokens.accent, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `2px solid ${tokens.text}20`,
              }}>
                <span style={{ fontSize: thumbnail ? 5 : 9, fontWeight: 900, color: tokens.stampActiveIcon }}>
                  {(data.nom[0] || "W").toUpperCase()}
                </span>
              </div>
            )}
            {data.slogan && !thumbnail && (
              <div style={{ fontSize: 8, fontWeight: 600, color: tokens.textSecondary, maxWidth: 120, lineHeight: 1.2 }}>
                {data.slogan}
              </div>
            )}
          </div>
          {/* Badge WALLIO inversé */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            background: tokens.text, borderRadius: 100,
            padding: thumbnail ? "2px 5px" : "3px 10px", flexShrink: 0,
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 7, fontWeight: 900, letterSpacing: "0.08em", lineHeight: 1, color: tokens.background }}>WALLIO</span>
          </div>
        </div>

        {/* ── NOM ÉTABLISSEMENT — MASSIVE ── */}
        <div style={{
          padding: thumbnail ? "1% 6% 2%" : `${1 * fmtV}% 7% ${2 * fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div style={{
            fontSize: nameFontSize,
            fontWeight: 900,
            color: tokens.text,
            lineHeight: 0.88,
            letterSpacing: -1.5,
            textTransform: "uppercase",
          }}>
            {data.nom || "ÉTABLISSEMENT"}
          </div>
        </div>

        {/* ── TAMPONS GRANDS ── */}
        {data.mode === "progressif" && data.paliers ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: thumbnail ? "0 6%" : "0 7%", position: "relative", zIndex: 1 }}>
            <ProgressiveStamps
              paliers={data.paliers} palier_actuel={data.palier_actuel ?? 0}
              paliers_valides={data.paliers_valides ?? []} tampons={data.tampons}
              tokens={tokens} stampStyle={dims?.stampStyle} stampSize={dims?.stampSize}
              thumbnail={thumbnail}
            />
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 6%" : "0 7%", position: "relative", zIndex: 1 }}>
            <Stamps
              fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
              total={data.objectif_tampons} filled={filled}
              style={dims?.stampStyle ?? "circle"}
              tokens={tokens}
              size={thumbnail ? 10 : 24}
              gap={thumbnail ? 3 : 6}
              perRow={5}
            />
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: thumbnail ? "1% 6% 5%" : `${2 * fmtV}% 7% ${6 * fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
              Récompense
            </div>
            <div style={{ fontSize: thumbnail ? 5.5 : rs(9), fontWeight: 700, color: tokens.text }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: tokens.text, borderRadius: 100,
            padding: thumbnail ? "2px 6px" : "5px 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 900, lineHeight: 1, color: tokens.background }}>
                {filled}/{data.objectif_tampons}
              </span>
            </div>

            {!thumbnail && (
              <div style={{ marginTop: 5, textAlign: "center" }}>
                <div style={{ fontSize: 5, letterSpacing: "0.1em", color: `${tokens.background}70`, textTransform: "uppercase" as const, marginBottom: 1 }}>Titulaire</div>
                <div style={{ fontSize: ss(9), fontWeight: 700, color: tokens.background }}>
                  {data.client_prenom ? `${data.client_prenom} ${data.client_nom || ""}`.trim() : "Prénom Nom"}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    );
  },
};

export default template;
