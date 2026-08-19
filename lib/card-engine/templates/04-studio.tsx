import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  {
    id: "white-black-red", name: "White / Black / Red",
    tokens: {
      background: "#FFFFFF", surface: "#F0F0F0", surfaceSecondary: "#E0E0E0",
      text: "#0A0A0A", textSecondary: "#3A3A3A", textTertiary: "#8A8A8A",
      accent: "#D42B2B", accentSecondary: "#FF3B30",
      stampActive: "#0A0A0A", stampActiveIcon: "#FFFFFF", stampInactive: "#E0E0E0",
      border: "#E0E0E0", borderStrong: "#C0C0C0",
      qrBackground: "#FFFFFF", qrForeground: "#0A0A0A",
      rewardBackground: "#F0F0F0",
    },
  },
  {
    id: "cream-navy-orange", name: "Cream / Navy / Orange",
    tokens: {
      background: "#F8F4EC", surface: "#EDE7DA", surfaceSecondary: "#D8D0C0",
      text: "#0E1C38", textSecondary: "#2A3C5E", textTertiary: "#7A8AA0",
      accent: "#E86A10", accentSecondary: "#FF8C30",
      stampActive: "#0E1C38", stampActiveIcon: "#F8F4EC", stampInactive: "#D8D0C0",
      border: "#D8D0C0", borderStrong: "#C0B8A8",
      qrBackground: "#FFFFFF", qrForeground: "#0E1C38",
      rewardBackground: "#EDE7DA",
    },
  },
  {
    id: "black-electric", name: "Black / Electric Blue",
    tokens: {
      background: "#0A0A0C", surface: "#141418", surfaceSecondary: "#1E1E24",
      text: "#FFFFFF", textSecondary: "#A0A8C0", textTertiary: "#505870",
      accent: "#0070FF", accentSecondary: "#40A0FF",
      stampActive: "#0070FF", stampActiveIcon: "#FFFFFF", stampInactive: "#1E1E24",
      border: "#1E1E24", borderStrong: "#2E2E38",
      qrBackground: "#FFFFFF", qrForeground: "#0A0A0C",
      rewardBackground: "#141418",
    },
  },
];

const template: CardTemplate = {
  id: "04-studio",
  name: "STUDIO",
  subtitle: "Swiss Editorial",
  description: "Grille typographique stricte, alignements précis, magazine contemporain.",
  categories: ["editorial", "modern", "minimal"],
  palettes,
  defaultPaletteId: "white-black-red",
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
        {/* Ligne rouge verticale — signature Swiss */}
        <div style={{
          position: "absolute", left: thumbnail ? "24%" : "25%", top: 0, bottom: 0,
          width: thumbnail ? 1.5 : 2.5, background: tokens.accent, opacity: 0.85,
        }}/>

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "6% 7% 3%" : `${7*fmtV}% 8% ${4*fmtV}%`,
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
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.stampActiveIcon }}>
                  {(data.nom[0] || "W").toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 700, color: tokens.text, letterSpacing: -0.3, textTransform: "uppercase", lineHeight: 1.2 }}>
                {data.nom || "Établissement"}
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
            border: `1px solid ${tokens.accent}25`, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", lineHeight: 1, color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS — carrés Swiss */}
                  {/* Mode progressif */}
          {data.mode === "progressif" && data.paliers ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
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
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: thumbnail ? "0 7%" : "0 8%", position: "relative", zIndex: 1 }}>
          <Stamps fillWidth={!thumbnail} sizeOverride={!thumbnail ? dims?.stampSize : undefined}
            total={data.objectif_tampons} filled={filled}
            style={(dims?.stampStyle ?? "square")} tokens={tokens}
            size={thumbnail ? 8 : 16} gap={thumbnail ? 2 : 4} perRow={9}
          />
        </div>
          )}

        {/* FOOTER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
              Récompense
            </div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}15`, backdropFilter: "blur(8px)",
            borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: `1px solid ${tokens.accent}20`,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, lineHeight: 1, color: tokens.accent }}>
              {filled}/{data.objectif_tampons}
            </span>
            </div>
          </div>
        
            {/* Titulaire */}
            {!thumbnail && (
              <div style={{ marginTop: thumbnail ? 3 : 6 }}>
                <div style={{ fontSize: 5, letterSpacing: "0.12em", color: tokens.textTertiary, textTransform: "uppercase" as const, marginBottom: 1 }}>Titulaire</div>
                <div style={{ fontSize: thumbnail ? 5 : ss(9), fontWeight: 600, color: tokens.text }}>
                  {data.client_prenom ? `${data.client_prenom} ${data.client_nom || ""}`.trim() : "Prénom Nom"}
                </div>
              </div>
            )}
            </div>
      </div>
    );
  },
};

export default template;
