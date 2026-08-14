import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  {
    id: "wallio-light", name: "Wallio Light",
    tokens: {
      background: "#F8F7F4", surface: "rgba(255,255,255,0.7)", surfaceSecondary: "rgba(0,122,255,0.06)",
      text: "#0A0A0A", textSecondary: "#5A5A6A", textTertiary: "#9A9AAA",
      accent: "#007AFF", accentSecondary: "#BF5AF2",
      stampActive: "#007AFF", stampActiveIcon: "#FFFFFF", stampInactive: "rgba(0,122,255,0.12)",
      border: "rgba(0,0,0,0.08)", borderStrong: "rgba(0,0,0,0.14)",
      qrBackground: "#FFFFFF", qrForeground: "#0A0A0A",
      rewardBackground: "rgba(0,122,255,0.06)",
    },
  },
  {
    id: "wallio-dark", name: "Wallio Dark",
    tokens: {
      background: "#111113", surface: "rgba(255,255,255,0.06)", surfaceSecondary: "rgba(255,255,255,0.04)",
      text: "#FFFFFF", textSecondary: "#AEAEB2", textTertiary: "#636366",
      accent: "#0A84FF", accentSecondary: "#BF5AF2",
      stampActive: "#0A84FF", stampActiveIcon: "#FFFFFF", stampInactive: "rgba(255,255,255,0.1)",
      border: "rgba(255,255,255,0.1)", borderStrong: "rgba(255,255,255,0.15)",
      qrBackground: "#FFFFFF", qrForeground: "#111113",
      rewardBackground: "rgba(255,255,255,0.05)",
    },
  },
  {
    id: "wallio-soft", name: "Wallio Soft",
    tokens: {
      background: "#EEF3FF", surface: "rgba(255,255,255,0.8)", surfaceSecondary: "rgba(94,92,230,0.08)",
      text: "#1A1A2E", textSecondary: "#4A4A7A", textTertiary: "#9A9ABB",
      accent: "#5E5CE6", accentSecondary: "#BF5AF2",
      stampActive: "#5E5CE6", stampActiveIcon: "#FFFFFF", stampInactive: "rgba(94,92,230,0.15)",
      border: "rgba(94,92,230,0.15)", borderStrong: "rgba(94,92,230,0.25)",
      qrBackground: "#FFFFFF", qrForeground: "#1A1A2E",
      rewardBackground: "rgba(94,92,230,0.06)",
    },
  },
];

const template: CardTemplate = {
  id: "50-wallio",
  name: "WALLIO",
  subtitle: "Wallio Signature",
  description: "Le design signature de Wallio. Minimalisme iOS, gradient bleu/violet, grands espaces.",
  categories: ["minimal", "premium", "modern"],
  palettes,
  defaultPaletteId: "wallio-light",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const pct = (filled / data.objectif_tampons) * 100;
    const isDark = tokens.background === "#111113";

    return (
      <div style={{
        width: "100%", height: "100%",
        background: isDark
          ? `radial-gradient(ellipse at 80% 20%, rgba(10,132,255,0.12) 0%, transparent 60%), ${tokens.background}`
          : tokens.background,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "5.5% 6%",
        fontFamily: "-apple-system, 'SF Pro Display', Inter, sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Cercle décoratif — inspiration NFC */}
        <div style={{
          position: "absolute", right: thumbnail ? "-8%" : "-12%", top: "50%",
          transform: "translateY(-50%)",
          width: thumbnail ? 60 : 110, height: thumbnail ? 60 : 110, borderRadius: "50%",
          border: `1px solid ${tokens.border}`,
          pointerEvents: "none",
        }}/>
        <div style={{
          position: "absolute", right: thumbnail ? "-3%" : "-5%", top: "50%",
          transform: "translateY(-50%)",
          width: thumbnail ? 40 : 74, height: thumbnail ? 40 : 74, borderRadius: "50%",
          border: `1px solid ${tokens.borderStrong}`,
          pointerEvents: "none",
        }}/>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: thumbnail ? 18 : 28, height: thumbnail ? 18 : 28, borderRadius: 8, objectFit: "cover" }}/>
            ) : (
              <div style={{
                width: thumbnail ? 18 : 28, height: thumbnail ? 18 : 28, borderRadius: 8,
                background: `linear-gradient(135deg, ${tokens.accent}, ${tokens.accentSecondary})`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 800, color: "#fff" }}>W</span>
              </div>
            )}
            <div>
              <span style={{ fontSize: thumbnail ? 8 : 13, fontWeight: 600, color: tokens.text, letterSpacing: -0.3 }}>{data.nom || "Wallio"}</span>
              {data.slogan && !thumbnail && <div style={{ fontSize: 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic" }}>{data.slogan}</div>}
            </div>
          </div>
          <div style={{
            padding: thumbnail ? "1px 4px" : "2px 8px", borderRadius: 20,
            background: `linear-gradient(135deg, ${tokens.accent}22, ${tokens.accentSecondary}22)`,
            border: `1px solid ${tokens.accent}33`,
          }}>
            <span style={{ fontSize: thumbnail ? 5 : 8, fontWeight: 700, letterSpacing: "0.1em",
              background: `linear-gradient(135deg, ${tokens.accent}, ${tokens.accentSecondary})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>WALLIO</span>
          </div>
        </div>

        {/* Tampons */}
        <div style={{ zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined} total={data.objectif_tampons} filled={filled}
            style="circle" tokens={tokens}
            size={thumbnail ? 11 : 20} gap={thumbnail ? 3 : 5} perRow={9}
          />
        </div>

        {/* Progress + QR */}
        <div style={{ zIndex: 1 }}>
          <div style={{ height: thumbnail ? 1.5 : 2, borderRadius: 1, background: tokens.border, overflow: "hidden", marginBottom: thumbnail ? 3 : 6 }}>
            <div style={{
              height: "100%", width: `${pct}%`,
              background: `linear-gradient(90deg, ${tokens.accent}, ${tokens.accentSecondary})`,
              borderRadius: 1, transition: "width 0.5s ease",
            }}/>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 6 : 9, color: tokens.textTertiary }}>{data.nom_recompense}</div>
              <div style={{ fontSize: thumbnail ? 7 : 10, fontWeight: 600, color: tokens.textSecondary, marginTop: 1 }}>
                {filled}/{data.objectif_tampons}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    );
  },
};

export default template;
