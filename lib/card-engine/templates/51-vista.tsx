import type { CardTemplate, CardPalette } from "../types";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  {
    id: "dark-glass", name: "Dark Glass",
    tokens: {
      background: "#111113", surface: "rgba(255,255,255,0.06)", surfaceSecondary: "rgba(255,255,255,0.04)",
      text: "#FFFFFF", textSecondary: "#AEAEB2", textTertiary: "#636366",
      accent: "#007AFF", accentSecondary: "#5E5CE6",
      stampActive: "#007AFF", stampActiveIcon: "#FFFFFF", stampInactive: "rgba(255,255,255,0.12)",
      border: "rgba(255,255,255,0.10)", borderStrong: "rgba(255,255,255,0.18)",
      qrBackground: "#FFFFFF", qrForeground: "#111113",
      rewardBackground: "rgba(255,255,255,0.05)",
    },
  },
  {
    id: "white-clean", name: "White Clean",
    tokens: {
      background: "#FFFFFF", surface: "#F5F5F7", surfaceSecondary: "#E8E8ED",
      text: "#1C1C1E", textSecondary: "#3A3A3C", textTertiary: "#8E8E93",
      accent: "#007AFF", accentSecondary: "#34C759",
      stampActive: "#007AFF", stampActiveIcon: "#FFFFFF", stampInactive: "#E8E8ED",
      border: "#E5E5EA", borderStrong: "#C7C7CC",
      qrBackground: "#FFFFFF", qrForeground: "#1C1C1E",
      rewardBackground: "#F5F5F7",
    },
  },
  {
    id: "sand-warm", name: "Sand Warm",
    tokens: {
      background: "#F5F0E8", surface: "#EDE5D8", surfaceSecondary: "#E0D4C0",
      text: "#1A1208", textSecondary: "#4A3A20", textTertiary: "#9A8A6A",
      accent: "#C88A30", accentSecondary: "#A06820",
      stampActive: "#C88A30", stampActiveIcon: "#F5F0E8", stampInactive: "#E0D4C0",
      border: "#D8C8A8", borderStrong: "#B8A888",
      qrBackground: "#FFFFFF", qrForeground: "#1A1208",
      rewardBackground: "#EDE5D8",
    },
  },
];

const template: CardTemplate = {
  id: "51-vista",
  name: "VISTA",
  subtitle: "Photo Cover",
  description: "Grande photo horizontale de couverture. Idéal restaurants, salons, hôtels.",
  categories: ["restaurant", "beauty", "premium", "modern"],
  palettes,
  defaultPaletteId: "dark-glass",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 14 : (dims?.logoSize ?? 22);
    const fmtV = dims?.format === "compact" ? 0.8 : dims?.format === "wide" ? 0.6 : 1;
    const defaultPhotoH = dims?.format === "wide" ? 22 : dims?.format === "compact" ? 30 : 38;
    const photoH = `${dims?.photoHeight ?? defaultPhotoH}%`;

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', Inter, sans-serif",
        overflow: "hidden",
      }}>

        {/* ── PHOTO DE COUVERTURE ── */}
        <div style={{ height: thumbnail ? "38%" : photoH, flexShrink: 0, position: "relative", overflow: "hidden" }}>
          {data.photo_url ? (
            <img
              src={data.photo_url}
              alt=""
              style={{
                width: "100%", height: "100%", objectFit: "cover", display: "block",
                objectPosition: `${dims?.photoPositionX ?? 50}% ${dims?.photoPositionY ?? 50}%`,
              }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: `linear-gradient(135deg, ${tokens.accent}55 0%, ${tokens.accentSecondary}40 60%, ${tokens.accent}20 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {!thumbnail && (
                <span style={{ fontSize: 9, letterSpacing: "0.14em", color: `${tokens.text}45`, fontWeight: 600, textTransform: "uppercase" }}>
                  Photo de couverture
                </span>
              )}
            </div>
          )}

          {/* Dégradé bas — fondu vers le background */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "60%",
            background: `linear-gradient(to bottom, transparent, ${tokens.background})`,
          }}/>

          {/* Badge WALLIO top-right sur la photo */}
          <div style={{
            position: "absolute", top: thumbnail ? 5 : 10, right: thumbnail ? 6 : 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.42)",
            borderRadius: 100, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: "1px solid rgba(255,255,255,0.22)",
          }}>
            <span style={{ fontSize: thumbnail ? 5 : 8, fontWeight: 700, letterSpacing: "0.08em", lineHeight: 1, color: "rgba(255,255,255,0.92)", whiteSpace: "nowrap" }}>
              WALLIO
            </span>
          </div>
        </div>

        {/* ── NOM + LOGO (juste sous la photo, overlap dégradé) ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: thumbnail ? 4 : 8,
          padding: thumbnail ? "1% 6% 1.5%" : `${1.5 * fmtV}% 7% ${1.5 * fmtV}%`,
          marginTop: thumbnail ? -4 : -8,
          position: "relative", zIndex: 1,
        }}>
          {data.logo_url ? (
            <img
              src={data.logo_url} alt=""
              style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 4 : 7, objectFit: "cover", flexShrink: 0, border: `1px solid ${tokens.borderStrong}` }}
            />
          ) : (
            <div style={{
              width: logoSz, height: logoSz, borderRadius: thumbnail ? 4 : 7, flexShrink: 0,
              background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: thumbnail ? 6 : 10, fontWeight: 700, color: tokens.stampActiveIcon }}>
                {(data.nom[0] || "W").toUpperCase()}
              </span>
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: thumbnail ? 7 : ns(12), fontWeight: 600, color: tokens.text,
              letterSpacing: -0.3, lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {data.nom || "Établissement"}
            </div>
            {data.slogan && !thumbnail && (
              <div style={{
                fontSize: rs(7.5), color: tokens.textTertiary, marginTop: 1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {data.slogan}
              </div>
            )}
          </div>
        </div>

        {/* ── TAMPONS ── */}
        {data.mode === "progressif" && data.paliers ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: thumbnail ? "0 6%" : "0 7%", position: "relative", zIndex: 1 }}>
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
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 6%" : "0 7%", position: "relative", zIndex: 1 }}>
            <Stamps
              fillWidth={!thumbnail}
              sizeOverride={!thumbnail ? dims?.stampSize : undefined}
              total={data.objectif_tampons}
              filled={filled}
              style={dims?.stampStyle ?? "circle"}
              tokens={tokens}
              size={thumbnail ? 8 : 17}
              gap={thumbnail ? 3 : 5}
              perRow={9}
            />
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: thumbnail ? "1% 6% 4%" : `${1.5 * fmtV}% 7% ${5 * fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: thumbnail ? 3.5 : rs(5.5), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
              Récompense
            </div>
            <div style={{ fontSize: thumbnail ? 5.5 : rs(9), fontWeight: 600, color: tokens.text }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}18`, backdropFilter: "blur(8px)",
            borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: `1px solid ${tokens.accent}25`,
          }}>
            <span style={{ fontSize: thumbnail ? 5.5 : ss(10), fontWeight: 700, color: tokens.accent }}>
              {filled}/{data.objectif_tampons}
            </span>

            {!thumbnail && (
              <div style={{ marginTop: 5 }}>
                <div style={{ fontSize: 5, letterSpacing: "0.12em", color: tokens.textTertiary, textTransform: "uppercase" as const, marginBottom: 1 }}>
                  Titulaire
                </div>
                <div style={{ fontSize: ss(9), fontWeight: 600, color: tokens.text }}>
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
