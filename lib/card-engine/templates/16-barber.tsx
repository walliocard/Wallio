import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "black-white-red", name: "Black / White / Red", tokens: { background: "#0A0A0A", surface: "#1A1A1A", surfaceSecondary: "#2A2A2A", text: "#FFFFFF", textSecondary: "#CCCCCC", textTertiary: "#666666", accent: "#CC2020", accentSecondary: "#EE3030", stampActive: "#FFFFFF", stampActiveIcon: "#0A0A0A", stampInactive: "#2A2A2A", border: "#2A2A2A", borderStrong: "#CC2020", qrBackground: "#FFFFFF", qrForeground: "#0A0A0A", rewardBackground: "#1A1A1A" } },
  { id: "black-gold", name: "Black / Gold", tokens: { background: "#0D0D0D", surface: "#1A1A14", surfaceSecondary: "#242418", text: "#F0E8C0", textSecondary: "#C0A040", textTertiary: "#605820", accent: "#C0A040", accentSecondary: "#E0C060", stampActive: "#C0A040", stampActiveIcon: "#0D0D0D", stampInactive: "#242418", border: "#282810", borderStrong: "#484820", qrBackground: "#F0E8C0", qrForeground: "#0D0D0D", rewardBackground: "#1A1A14" } },
  { id: "navy-cream", name: "Navy / Cream", tokens: { background: "#0A1428", surface: "#141E3A", surfaceSecondary: "#1E2A4E", text: "#F5EDD8", textSecondary: "#C0B090", textTertiary: "#607090", accent: "#C0B090", accentSecondary: "#E0D0B0", stampActive: "#F5EDD8", stampActiveIcon: "#0A1428", stampInactive: "#1E2A4E", border: "#2A3A54", borderStrong: "#3A4E70", qrBackground: "#F5EDD8", qrForeground: "#0A1428", rewardBackground: "#141E3A" } },
];

const template: CardTemplate = {
  id: "16-barber", name: "BARBER", subtitle: "Modern Barber",
  description: "Barber shop masculin, lignes horizontales, badge, typographie forte.",
  categories: ["barber", "premium", "street"],
  palettes, defaultPaletteId: "black-white-red",
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
        {/* Bande accent haut — signature barber */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: thumbnail ? 3 : logoSz, background: tokens.accent }}/>

        {/* Lignes horizontales décoratives subtiles */}
        {[20, 50].map((pct, i) => (
          <div key={i} style={{
            position: "absolute", top: `${pct}%`, left: 0, right: 0,
            height: "0.5px", background: tokens.border, opacity: 0.3,
          }}/>
        ))}

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "9% 7% 3%" : `${10*fmtV}% 8% ${4*fmtV}%`,
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
              <div style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.18em", color: tokens.accent, textTransform: "uppercase", marginBottom: 2, fontWeight: 600 }}>
                THE
              </div>
              <div style={{ fontSize: thumbnail ? 9 : ns(15), fontWeight: 900, color: tokens.text, letterSpacing: 1, textTransform: "uppercase", lineHeight: 1 }}>
                {data.nom || "BARBER"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 3 }}>
                  {data.slogan}
                </div>
              )}
            </div>
          </div>
          {/* Badge LOYALTY pill */}
          <div style={{
            background: `${tokens.accent}18`, backdropFilter: "blur(8px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: `1px solid ${tokens.accent}30`, flexShrink: 0,
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS — badge style barber */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style="badge" tokens={tokens}
            size={thumbnail ? 9 : 18} gap={thumbnail ? 3 : 5} perRow={8}
          />
        </div>

        {/* FOOTER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2, fontWeight: 600 }}>
              NEXT REWARD
            </div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}18`, backdropFilter: "blur(8px)",
            borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: `1px solid ${tokens.accent}28`,
          }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(12), fontWeight: 900, color: tokens.accent }}>
              {filled}/{data.objectif_tampons}
            </span>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
