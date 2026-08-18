import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "navy-gold", name: "Navy / Gold", tokens: { background: "#0A1428", surface: "#162040", surfaceSecondary: "#1E2E54", text: "#F0E8CC", textSecondary: "#C6A040", textTertiary: "#5A4820", accent: "#C6A040", accentSecondary: "#E8C060", stampActive: "#C6A040", stampActiveIcon: "#0A1428", stampInactive: "#1E2E54", border: "#2A3E60", borderStrong: "#4A5E80", qrBackground: "#F0E8CC", qrForeground: "#0A1428", rewardBackground: "#162040" } },
  { id: "forest-cream", name: "Forest / Cream", tokens: { background: "#0E1E14", surface: "#182A1E", surfaceSecondary: "#223828", text: "#F0EAD8", textSecondary: "#C0B080", textTertiary: "#506040", accent: "#C0B080", accentSecondary: "#E0D0A0", stampActive: "#C0B080", stampActiveIcon: "#0E1E14", stampInactive: "#223828", border: "#2A3A28", borderStrong: "#405040", qrBackground: "#F0EAD8", qrForeground: "#0E1E14", rewardBackground: "#182A1E" } },
  { id: "burgundy-ivory", name: "Burgundy / Ivory", tokens: { background: "#1E0810", surface: "#2E1018", surfaceSecondary: "#401420", text: "#F5EDDE", textSecondary: "#C89060", textTertiary: "#604030", accent: "#C89060", accentSecondary: "#E8B080", stampActive: "#C89060", stampActiveIcon: "#1E0810", stampInactive: "#401420", border: "#3A1820", borderStrong: "#5A2A30", qrBackground: "#F5EDDE", qrForeground: "#1E0810", rewardBackground: "#2E1018" } },
];

const template: CardTemplate = {
  id: "06-club", name: "CLUB", subtitle: "Heritage / Private Club",
  description: "Club privé, monogramme, typographie serif, badge de fidélité.",
  categories: ["luxury", "premium", "barber"],
  palettes, defaultPaletteId: "navy-gold",
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
        {/* Bordure intérieure fine — style club privé */}
        <div style={{
          position: "absolute", inset: thumbnail ? 4 : 7,
          border: `0.5px solid ${tokens.accent}30`, pointerEvents: "none",
        }}/>

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "10% 9% 4%" : `${11*fmtV}% 10% ${5*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: "50%", objectFit: "cover", border: `1px solid ${tokens.accent}50` }}/>
            ) : (
              <div style={{
                width: thumbnail ? 18 : 30, height: thumbnail ? 18 : 30, borderRadius: "50%",
                border: `1.5px solid ${tokens.accent}70`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: thumbnail ? 8 : 14, fontWeight: 700, color: tokens.accent }}>
                  {(data.nom[0] || "C").toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 600, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>
                {data.nom || "The Club"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>
                  {data.slogan}
                </div>
              )}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}18`, backdropFilter: "blur(8px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: `1px solid ${tokens.accent}30`, flexShrink: 0,
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* Séparateur ornemental */}
        {!thumbnail && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, paddingBottom: 8, position: "relative", zIndex: 1 }}>
            <div style={{ height: "0.5px", width: 20, background: tokens.accent, opacity: 0.4 }}/>
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: tokens.accent, opacity: 0.6 }}/>
            <div style={{ height: "0.5px", width: 20, background: tokens.accent, opacity: 0.4 }}/>
          </div>
        )}

        {/* TAMPONS — badge style club */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 9%" : "0 10%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style="badge" tokens={tokens}
            size={thumbnail ? 9 : 18} gap={thumbnail ? 3 : 5} perRow={8}
          />
        </div>

        {/* FOOTER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: thumbnail ? "4% 9% 10%" : `${5*fmtV}% 10% ${11*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
              Récompense
            </div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.textSecondary }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}15`, backdropFilter: "blur(8px)",
            borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: `1px solid ${tokens.accent}25`,
          }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, color: tokens.accent }}>
              {filled}/{data.objectif_tampons}
            </span>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
