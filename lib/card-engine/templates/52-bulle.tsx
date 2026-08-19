import type { CardTemplate, CardPalette } from "../types";
import { renderStrip } from "../strip";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  {
    id: "lavender-plum", name: "Lavande / Prune",
    tokens: {
      background: "#EBE0F5", surface: "#D4BFEA", surfaceSecondary: "#BBAACC",
      text: "#2E1442", textSecondary: "#6A3A8A", textTertiary: "#9A72AA",
      accent: "#6A2A8A", accentSecondary: "#9A50BA",
      stampActive: "#6A2A8A", stampActiveIcon: "#EBE0F5", stampInactive: "#CDB8DF",
      border: "#C0A8D8", borderStrong: "#9A80AA",
      qrBackground: "#EBE0F5", qrForeground: "#2E1442",
      rewardBackground: "#D4BFEA",
    },
  },
  {
    id: "mint-forest", name: "Menthe / Forêt",
    tokens: {
      background: "#D8F0E8", surface: "#B8DDD0", surfaceSecondary: "#98C8B8",
      text: "#0E2A1E", textSecondary: "#2A5A42", textTertiary: "#5A8A72",
      accent: "#1A5A3C", accentSecondary: "#2A8A5C",
      stampActive: "#1A5A3C", stampActiveIcon: "#D8F0E8", stampInactive: "#98C8B8",
      border: "#8AC0A8", borderStrong: "#5A9880",
      qrBackground: "#D8F0E8", qrForeground: "#0E2A1E",
      rewardBackground: "#B8DDD0",
    },
  },
  {
    id: "peach-terracotta", name: "Pêche / Terracotta",
    tokens: {
      background: "#F8EAE0", surface: "#EDD5C5", surfaceSecondary: "#DFBFA8",
      text: "#2E0E04", textSecondary: "#6A3020", textTertiary: "#9A6050",
      accent: "#C04820", accentSecondary: "#E06840",
      stampActive: "#C04820", stampActiveIcon: "#F8EAE0", stampInactive: "#DFBFA8",
      border: "#D0A888", borderStrong: "#A88060",
      qrBackground: "#F8EAE0", qrForeground: "#2E0E04",
      rewardBackground: "#EDD5C5",
    },
  },
];

const template: CardTemplate = {
  id: "52-bulle",
  name: "BULLE",
  subtitle: "Organic Bubble",
  description: "Grands tampons circulaires, formes organiques, esthétique bubble tea. Pastel, doux, vivant.",
  categories: ["colorful", "beauty", "restaurant", "nature"],
  palettes,
  defaultPaletteId: "lavender-plum",
  render({ data, tokens, thumbnail, dimensions, strip }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 14 : (dims?.logoSize ?? 26);
    const fmtV = dims?.format === "compact" ? 0.78 : dims?.format === "wide" ? 0.58 : 1;

    if (strip) return renderStrip(data, tokens, {
      decoratives: (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 375 144" preserveAspectRatio="none">
          <ellipse cx="320" cy="18" rx="80" ry="32" fill={tokens.accent} opacity="0.18" transform="rotate(-15 320 18)"/>
          <ellipse cx="55" cy="122" rx="60" ry="26" fill={tokens.accentSecondary} opacity="0.14" transform="rotate(20 55 122)"/>
          <circle cx="280" cy="100" r="18" fill={tokens.accentSecondary} opacity="0.12"/>
          <circle cx="310" cy="118" r="10" fill={tokens.accent} opacity="0.15"/>
          <circle cx="50" cy="40" r="12" fill={tokens.accent} opacity="0.12"/>
          <circle cx="30" cy="60" r="7" fill={tokens.accentSecondary} opacity="0.18"/>
        </svg>
      ),
    });

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Rounded', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>

        {/* ── Blobs organiques SVG ── */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 375 246" preserveAspectRatio="none">
          {/* Grand blob haut-droite */}
          <ellipse cx="320" cy="30" rx="80" ry="55" fill={tokens.accent} opacity="0.18" transform="rotate(-15 320 30)"/>
          {/* Blob bas-gauche */}
          <ellipse cx="55" cy="210" rx="60" ry="45" fill={tokens.accentSecondary} opacity="0.14" transform="rotate(20 55 210)"/>
          {/* Petites bulles */}
          <circle cx="280" cy="170" r="18" fill={tokens.accentSecondary} opacity="0.12"/>
          <circle cx="310" cy="200" r="10" fill={tokens.accent} opacity="0.15"/>
          <circle cx="50" cy="70" r="12" fill={tokens.accent} opacity="0.12"/>
          <circle cx="30" cy="100" r="7" fill={tokens.accentSecondary} opacity="0.18"/>
          <circle cx="340" cy="130" r="8" fill={tokens.accent} opacity="0.10"/>
        </svg>

        {/* ── HEADER ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: thumbnail ? "6% 6% 2%" : `${7 * fmtV}% 7% ${3 * fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 4 : 8 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: logoSz, height: logoSz, borderRadius: "50%", objectFit: "cover", border: `2px solid ${tokens.accent}40` }}/>
            ) : (
              <div style={{
                width: logoSz, height: logoSz, borderRadius: "50%", flexShrink: 0,
                background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center",
                border: `2px solid ${tokens.accent}60`,
              }}>
                <span style={{ fontSize: thumbnail ? 6 : 11, fontWeight: 800, color: tokens.stampActiveIcon }}>
                  {(data.nom[0] || "W").toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 7 : ns(12), fontWeight: 700, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>
                {data.nom || "Établissement"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 1 }}>{data.slogan}</div>
              )}
            </div>
          </div>
          {/* Badge WALLIO */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            background: tokens.accent, borderRadius: 100,
            padding: thumbnail ? "2px 5px" : "3px 9px", flexShrink: 0,
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 7, fontWeight: 800, letterSpacing: "0.08em", lineHeight: 1, color: tokens.stampActiveIcon }}>WALLIO</span>
          </div>
        </div>

        {/* ── GRANDS TAMPONS CIRCULAIRES ── */}
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
              style={dims?.stampStyle ?? "ring"}
              tokens={tokens}
              size={thumbnail ? 11 : 28}
              gap={thumbnail ? 3 : 7}
              perRow={5}
            />
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: thumbnail ? "2% 6% 5%" : `${3 * fmtV}% 7% ${6 * fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
              Récompense
            </div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 700, color: tokens.text }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: tokens.accent, borderRadius: 100,
            padding: thumbnail ? "2px 6px" : "5px 12px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 800, lineHeight: 1, color: tokens.stampActiveIcon }}>
                {filled}/{data.objectif_tampons}
              </span>
            </div>

            {!thumbnail && (
              <div style={{ marginTop: 5, textAlign: "center" }}>
                <div style={{ fontSize: 5, letterSpacing: "0.1em", color: `${tokens.stampActiveIcon}80`, textTransform: "uppercase" as const, marginBottom: 1 }}>Titulaire</div>
                <div style={{ fontSize: ss(9), fontWeight: 700, color: tokens.stampActiveIcon }}>
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
