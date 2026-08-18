import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  {
    id: "cream-black", name: "Cream / Black",
    tokens: {
      background: "#F8F5EE", surface: "#EDE8DC", surfaceSecondary: "#DED8C8",
      text: "#0A0A0A", textSecondary: "#3A3A3A", textTertiary: "#8A8A8A",
      accent: "#0A0A0A", accentSecondary: "#3A3A3A",
      stampActive: "#0A0A0A", stampActiveIcon: "#F8F5EE", stampInactive: "#DED8C8",
      border: "#C8C0B0", borderStrong: "#A8A090",
      qrBackground: "#FFFFFF", qrForeground: "#0A0A0A",
      rewardBackground: "#EDE8DC",
    },
  },
  {
    id: "black-white", name: "Black / White",
    tokens: {
      background: "#0A0A0A", surface: "#1A1A1A", surfaceSecondary: "#2A2A2A",
      text: "#FFFFFF", textSecondary: "#AAAAAA", textTertiary: "#555555",
      accent: "#FFFFFF", accentSecondary: "#AAAAAA",
      stampActive: "#FFFFFF", stampActiveIcon: "#0A0A0A", stampInactive: "#2A2A2A",
      border: "#3A3A3A", borderStrong: "#4A4A4A",
      qrBackground: "#FFFFFF", qrForeground: "#0A0A0A",
      rewardBackground: "#1A1A1A",
    },
  },
  {
    id: "sage-forest", name: "Sage / Forest",
    tokens: {
      background: "#EDF2ED", surface: "#DDE8DD", surfaceSecondary: "#CCDACC",
      text: "#1A2E1A", textSecondary: "#3A5A3A", textTertiary: "#7A9A7A",
      accent: "#1A2E1A", accentSecondary: "#3A5A3A",
      stampActive: "#1A2E1A", stampActiveIcon: "#EDF2ED", stampInactive: "#CCDACC",
      border: "#B8CCBA", borderStrong: "#98AE9A",
      qrBackground: "#FFFFFF", qrForeground: "#1A2E1A",
      rewardBackground: "#DDE8DD",
    },
  },
];

const template: CardTemplate = {
  id: "48-frame",
  name: "FRAME",
  subtitle: "Ultra Minimal Frame",
  description: "Cadre fin, contenu centré, espaces parfaits. Sophistication absolue.",
  categories: ["minimal", "premium", "luxury"],
  palettes,
  defaultPaletteId: "cream-black",
  render({ data, tokens, thumbnail, dimensions }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    const dims = dimensions;
    const ns = (n: number) => thumbnail ? n : Math.round(n * (dims?.nameScale ?? 1));
    const rs = (n: number) => thumbnail ? n : Math.round(n * (dims?.rewardScale ?? 1));
    const ss = (n: number) => thumbnail ? n : Math.round(n * (dims?.scoreScale ?? 1));
    const logoSz = thumbnail ? 16 : (dims?.logoSize ?? 28);
    const fmtV = dims?.format === "compact" ? 0.68 : dims?.format === "wide" ? 0.52 : 1;
    const frameW = thumbnail ? 1 : 1.5;
    const frameMargin = thumbnail ? "4%" : "5%";

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", alignItems: "stretch", justifyContent: "stretch",
        padding: frameMargin,
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      }}>
        {/* Cadre intérieur — minimal/premium */}
        <div style={{
          flex: 1, border: `${frameW}px solid ${tokens.border}`,
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: thumbnail ? "4% 5%" : "5% 6%", position: "relative",
        }}>
          {/* Coins décoratifs */}
          {[
            { top: -frameW, left: -frameW, borderTop: `${frameW*2.5}px solid ${tokens.borderStrong}`, borderLeft: `${frameW*2.5}px solid ${tokens.borderStrong}` },
            { top: -frameW, right: -frameW, borderTop: `${frameW*2.5}px solid ${tokens.borderStrong}`, borderRight: `${frameW*2.5}px solid ${tokens.borderStrong}` },
            { bottom: -frameW, left: -frameW, borderBottom: `${frameW*2.5}px solid ${tokens.borderStrong}`, borderLeft: `${frameW*2.5}px solid ${tokens.borderStrong}` },
            { bottom: -frameW, right: -frameW, borderBottom: `${frameW*2.5}px solid ${tokens.borderStrong}`, borderRight: `${frameW*2.5}px solid ${tokens.borderStrong}` },
          ].map((style, i) => (
            <div key={i} style={{ position: "absolute", width: thumbnail ? 8 : logoSz, height: thumbnail ? 8 : logoSz, ...style }}/>
          ))}

          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
              {data.logo_url ? (
                <img src={data.logo_url} alt="" style={{ width: logoSz, height: logoSz, objectFit: "cover" }}/>
              ) : null}
              <div>
                <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 600, letterSpacing: -0.3, color: tokens.text, lineHeight: 1.2 }}>
                  {data.nom || "Établissement"}
                </div>
                {data.slogan && !thumbnail && <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>{data.slogan}</div>}
              </div>
            </div>
            <div style={{ background: `${tokens.accent}18`, backdropFilter: "blur(8px)", borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px", border: `1px solid ${tokens.accent}25`, flexShrink: 0 }}>
              <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: tokens.accent }}>WALLIO</span>
            </div>
          </div>

          {/* TAMPONS */}
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style="circle" tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}
          />

          {/* FOOTER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
              <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>{data.nom_recompense}</div>
            </div>
            <div style={{ background: `${tokens.accent}15`, backdropFilter: "blur(8px)", borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px", border: `1px solid ${tokens.accent}20` }}>
              <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, color: tokens.accent }}>{filled}/{data.objectif_tampons}</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export default template;
