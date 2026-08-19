import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "plum-gold", name: "Plum / Gold", tokens: { background: "#1A0828", surface: "#280A3E", surfaceSecondary: "#381058", text: "#F0E4F8", textSecondary: "#C090E0", textTertiary: "#806090", accent: "#C8A040", accentSecondary: "#E8C060", stampActive: "#C8A040", stampActiveIcon: "#1A0828", stampInactive: "#381058", border: "#2E1040", borderStrong: "#502080", qrBackground: "#F0E4F8", qrForeground: "#1A0828", rewardBackground: "#280A3E" } },
  { id: "midnight-rose", name: "Midnight / Rose", tokens: { background: "#120810", surface: "#201018", surfaceSecondary: "#2E1822", text: "#F4E8F0", textSecondary: "#E090B8", textTertiary: "#906080", accent: "#D06090", accentSecondary: "#F080B0", stampActive: "#D06090", stampActiveIcon: "#120810", stampInactive: "#2E1822", border: "#241018", borderStrong: "#401828", qrBackground: "#F4E8F0", qrForeground: "#120810", rewardBackground: "#201018" } },
  { id: "emerald-cream", name: "Emerald / Cream", tokens: { background: "#0A1A10", surface: "#102018", surfaceSecondary: "#182C20", text: "#F0F0E4", textSecondary: "#80C8A0", textTertiary: "#407050", accent: "#60C080", accentSecondary: "#80E0A0", stampActive: "#60C080", stampActiveIcon: "#0A1A10", stampInactive: "#182C20", border: "#182418", borderStrong: "#2A4030", qrBackground: "#F0F0E4", qrForeground: "#0A1A10", rewardBackground: "#102018" } },
];

const template: CardTemplate = {
  id: "32-velvet", name: "VELVET", subtitle: "Textile Précieux",
  description: "Profondeur velours, reflets doux, typographie fine sur fond sombre dense.",
  categories: ["luxury", "beauty", "premium"],
  palettes, defaultPaletteId: "plum-gold",
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
        {/* Texture velours — micro-motif diagonal luxury opacity 0.04 */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)` }}/>
        {/* Reflet satiné haut */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "30%", background: `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)` }}/>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: thumbnail ? "6% 7% 3%" : `${7*fmtV}% 8% ${4*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: logoSz, height: logoSz, borderRadius: "50%", objectFit: "cover", border: `1px solid ${tokens.accent}` }}/>
            ) : (
              <div style={{ width: logoSz, height: logoSz, borderRadius: "50%", border: `1px solid ${tokens.accent}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 600, color: tokens.accent }}>{(data.nom[0] || "W").toUpperCase()}</span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 600, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>{data.nom || "Établissement"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>{data.slogan}</div>}
            </div>
          </div>
          <div style={{ background: `${tokens.accent}18`, backdropFilter: "blur(8px)", borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px", border: `1px solid ${tokens.accent}25`, flexShrink: 0 }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", lineHeight: 1, color: tokens.accent }}>WALLIO</span>
          </div>
        </div>

        {/* TAMPONS */}
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
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}/>
        </div>
          )}

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>{data.nom_recompense}</div>
          </div>
          <div style={{ background: `${tokens.accent}15`, backdropFilter: "blur(8px)", borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px", border: `1px solid ${tokens.accent}20` }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, lineHeight: 1, color: tokens.accent }}>{filled}/{data.objectif_tampons}</span>
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
