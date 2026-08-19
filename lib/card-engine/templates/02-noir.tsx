import type { CardTemplate, CardPalette } from "../types";
import { renderStrip } from "../strip";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  {
    id: "black-gold", name: "Black / Gold",
    tokens: {
      background: "#0D0D0D", surface: "#1A1A1A", surfaceSecondary: "#242424",
      text: "#F0E6CC", textSecondary: "#C6A15B", textTertiary: "#6A5A3A",
      accent: "#C6A15B", accentSecondary: "#E8C87A",
      stampActive: "#C6A15B", stampActiveIcon: "#0D0D0D", stampInactive: "#2A2218",
      border: "#2A2218", borderStrong: "#4A3C22",
      qrBackground: "#F0E6CC", qrForeground: "#0D0D0D",
      rewardBackground: "#1A1A1A",
    },
  },
  {
    id: "black-silver", name: "Black / Silver",
    tokens: {
      background: "#101114", surface: "#1C1E22", surfaceSecondary: "#28292E",
      text: "#E8E8EA", textSecondary: "#BFC3CA", textTertiary: "#60636A",
      accent: "#BFC3CA", accentSecondary: "#DCDFE5",
      stampActive: "#BFC3CA", stampActiveIcon: "#101114", stampInactive: "#242528",
      border: "#28292E", borderStrong: "#3C3E44",
      qrBackground: "#E8E8EA", qrForeground: "#101114",
      rewardBackground: "#1C1E22",
    },
  },
  {
    id: "black-burgundy", name: "Black / Burgundy",
    tokens: {
      background: "#160D10", surface: "#221218", surfaceSecondary: "#2E1820",
      text: "#F0E0E4", textSecondary: "#A83C52", textTertiary: "#5A2030",
      accent: "#A83C52", accentSecondary: "#C4546A",
      stampActive: "#A83C52", stampActiveIcon: "#F0E0E4", stampInactive: "#2E1820",
      border: "#2E1820", borderStrong: "#4A2030",
      qrBackground: "#F0E0E4", qrForeground: "#160D10",
      rewardBackground: "#221218",
    },
  },
];

const template: CardTemplate = {
  id: "02-noir",
  name: "NOIR",
  subtitle: "Dark Luxury",
  description: "Fond noir, accents précieux, typographie serif. Classe absolue.",
  categories: ["luxury", "premium", "modern"],
  palettes,
  defaultPaletteId: "black-gold",
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
        <>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg, transparent, ${tokens.accent}, transparent)`, opacity: 0.6 }}/>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg, transparent, ${tokens.accent}, transparent)`, opacity: 0.6 }}/>
        </>
      ),
    });

    return (
      <div style={{
        width: "100%", height: "100%",
        background: tokens.background,
        display: "flex", flexDirection: "column",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {/* Filet doré haut — très subtil */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: thumbnail ? 1 : 1.5,
          background: `linear-gradient(90deg, transparent, ${tokens.accent}, transparent)`,
          opacity: 0.6,
        }}/>
        {/* Filet bas */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: thumbnail ? 1 : 1.5,
          background: `linear-gradient(90deg, transparent, ${tokens.accent}, transparent)`,
          opacity: 0.6,
        }}/>

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "6% 7% 3%" : `${7*fmtV}% 8% ${4*fmtV}%`,
          position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover", border: `1px solid ${tokens.accent}40` }}/>
            ) : (
              <div style={{
                width: thumbnail ? 16 : logoSz, height: thumbnail ? 16 : logoSz, borderRadius: thumbnail ? 5 : 8,
                border: `1px solid ${tokens.accent}60`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.accent }}>
                  {(data.nom[0] || "W").toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 600, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>
                {data.nom || "Établissement"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2, fontStyle: "italic" }}>
                  {data.slogan}
                </div>
              )}
            </div>
          </div>
          {/* Badge WALLIO pill translucide */}
          <div style={{
            background: `${tokens.accent}18`, backdropFilter: "blur(8px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: `1px solid ${tokens.accent}30`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", lineHeight: 1, color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS — style ring pour luxe */}
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
            style={(dims?.stampStyle ?? "ring")} tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={10}
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
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.accent }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}15`, backdropFilter: "blur(8px)",
            borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px",
            border: `1px solid ${tokens.accent}25`,
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
