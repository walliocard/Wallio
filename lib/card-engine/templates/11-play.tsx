import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "pastel", name: "Pastel", tokens: { background: "#FFF0F8", surface: "#FFE0F0", surfaceSecondary: "#FFD0E8", text: "#2A0A20", textSecondary: "#8A2060", textTertiary: "#C080A0", accent: "#E040A0", accentSecondary: "#FF80C0", stampActive: "#E040A0", stampActiveIcon: "#FFFFFF", stampInactive: "#FFD0E8", border: "#F0B0D0", borderStrong: "#D890B0", qrBackground: "#FFFFFF", qrForeground: "#2A0A20", rewardBackground: "#FFE0F0" } },
  { id: "primary", name: "Primary", tokens: { background: "#FFF8E0", surface: "#FFF0C0", surfaceSecondary: "#FFE8A0", text: "#0A1A40", textSecondary: "#0A4090", textTertiary: "#6080B0", accent: "#E02020", accentSecondary: "#0060E0", stampActive: "#0060E0", stampActiveIcon: "#FFFFFF", stampInactive: "#FFE8A0", border: "#F0D880", borderStrong: "#D0B840", qrBackground: "#FFFFFF", qrForeground: "#0A1A40", rewardBackground: "#FFF0C0" } },
  { id: "candy", name: "Candy", tokens: { background: "#F0F8FF", surface: "#E0F0FF", surfaceSecondary: "#D0E8FF", text: "#0A1428", textSecondary: "#4060A0", textTertiary: "#8090C0", accent: "#FF4080", accentSecondary: "#8040FF", stampActive: "#FF4080", stampActiveIcon: "#FFFFFF", stampInactive: "#D0E8FF", border: "#C0D8F0", borderStrong: "#A0C0E0", qrBackground: "#FFFFFF", qrForeground: "#0A1428", rewardBackground: "#E0F0FF" } },
];

const template: CardTemplate = {
  id: "11-play", name: "PLAY", subtitle: "Playful",
  description: "Joyeux, formes flottantes, typographie arrondie, récompense très visible.",
  categories: ["colorful", "modern", "street"],
  palettes, defaultPaletteId: "pastel",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Formes flottantes décoratives — opacity très réduite */}
        {[
          { size: thumbnail ? 20 : 38, x: "78%", y: "5%", bg: tokens.accent, opacity: 0.1 },
          { size: thumbnail ? 14 : 28, x: "5%", y: "55%", bg: tokens.accentSecondary, opacity: 0.08 },
          { size: thumbnail ? 10 : 18, x: "65%", y: "70%", bg: tokens.surface, opacity: 0.5 },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", left: s.x, top: s.y, width: s.size, height: s.size, borderRadius: "50%", background: s.bg, opacity: s.opacity }}/>
        ))}

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "6% 7% 3%" : "7% 8% 4%",
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: thumbnail ? 16 : 28, height: thumbnail ? 16 : 28, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{
                width: thumbnail ? 16 : 28, height: thumbnail ? 16 : 28, borderRadius: thumbnail ? 5 : 8,
                background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.stampActiveIcon }}>
                  {(data.nom[0] || "W").toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(14), fontWeight: 700, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>
                {data.nom || "Play"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>
                  {data.slogan}
                </div>
              )}
            </div>
          </div>
          {/* Badge WALLIO */}
          <div style={{
            background: `${tokens.accent}18`, backdropFilter: "blur(8px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: `1px solid ${tokens.accent}28`, flexShrink: 0,
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style="circle" tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 5} perRow={9}
          />
        </div>

        {/* FOOTER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: thumbnail ? "3% 7% 6%" : "4% 8% 7%",
          position: "relative", zIndex: 1,
        }}>
          <div style={{
            background: `${tokens.accent}15`, backdropFilter: "blur(8px)",
            borderRadius: 20, padding: thumbnail ? "3px 8px" : "5px 14px",
            border: `1px solid ${tokens.accent}22`,
          }}>
            <span style={{ fontSize: thumbnail ? 5 : rs(9), fontWeight: 700, color: tokens.accent }}>
              {data.nom_recompense}
            </span>
          </div>
          <div style={{
            background: `${tokens.accent}18`, backdropFilter: "blur(8px)",
            borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: `1px solid ${tokens.accent}25`,
          }}>
            <span style={{ fontSize: thumbnail ? 6 : 11, fontWeight: 700, color: tokens.accent }}>
              {filled}/{data.objectif_tampons}
            </span>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
