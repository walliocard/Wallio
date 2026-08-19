import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "sand-black", name: "Sand / Black", tokens: { background: "#E8D8B0", surface: "#D8C498", surfaceSecondary: "#C8B080", text: "#0A0804", textSecondary: "#2A2010", textTertiary: "#6A5830", accent: "#0A0804", accentSecondary: "#2A2010", stampActive: "#0A0804", stampActiveIcon: "#E8D8B0", stampInactive: "#C8B080", border: "#C0A868", borderStrong: "#A08848", qrBackground: "#FFFFFF", qrForeground: "#0A0804", rewardBackground: "#D8C498" } },
  { id: "terracotta-cream", name: "Terracotta / Cream", tokens: { background: "#F0E0D0", surface: "#E0C8B4", surfaceSecondary: "#D0B098", text: "#1A0808", textSecondary: "#6A2A18", textTertiary: "#AA7050", accent: "#8A3020", accentSecondary: "#B04830", stampActive: "#8A3020", stampActiveIcon: "#F0E0D0", stampInactive: "#D0B098", border: "#C8A080", borderStrong: "#A88060", qrBackground: "#FFFFFF", qrForeground: "#1A0808", rewardBackground: "#E0C8B4" } },
  { id: "olive-sand", name: "Olive / Sand", tokens: { background: "#E8E4CC", surface: "#D8D0AE", surfaceSecondary: "#C8C090", text: "#0E140A", textSecondary: "#3A4020", textTertiary: "#6A7050", accent: "#4A5020", accentSecondary: "#6A7030", stampActive: "#4A5020", stampActiveIcon: "#E8E4CC", stampInactive: "#C8C090", border: "#B8B878", borderStrong: "#989858", qrBackground: "#FFFFFF", qrForeground: "#0E140A", rewardBackground: "#D8D0AE" } },
];

const template: CardTemplate = {
  id: "13-oasis", name: "OASIS", subtitle: "Desert Luxury",
  description: "Beige, sable, architecture désertique. Typographie serif élégante.",
  categories: ["premium", "restaurant", "nature"],
  palettes, defaultPaletteId: "sand-black",
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
        {/* Bande de sable haut — décoration désertique subtile */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: thumbnail ? "32%" : "35%", background: tokens.surface, opacity: 0.6 }}/>
        <svg style={{ position: "absolute", top: thumbnail ? "23%" : "26%", left: 0, right: 0 }} width="100%" height={thumbnail ? 16 : 26} viewBox="0 0 375 26" preserveAspectRatio="none">
          <path d="M0 0 L375 13 L375 26 L0 26 Z" fill={tokens.background}/>
        </svg>

        {/* HEADER */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: thumbnail ? "5% 7% 3%" : `${6*fmtV}% 8% ${4*fmtV}%`,
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
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 600, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>
                {data.nom || "Oasis"}
              </div>
              {data.slogan && !thumbnail && (
                <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2, fontStyle: "italic" }}>
                  {data.slogan}
                </div>
              )}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}15`, backdropFilter: "blur(8px)",
            borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px",
            border: `1px solid ${tokens.accent}25`, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", lineHeight: 1, color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS — rounded désert */}
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
            style={(dims?.stampStyle ?? "rounded")} tokens={tokens}
            size={thumbnail ? 8 : 16} gap={thumbnail ? 3 : 5} perRow={9}
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
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
              Récompense
            </div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>
              {data.nom_recompense}
            </div>
          </div>
          <div style={{
            background: `${tokens.accent}15`,
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
