import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "forest-cream", name: "Forest / Cream", tokens: { background: "#F2EEE4", surface: "#E4DED0", surfaceSecondary: "#D4CEBC", text: "#0E1A0A", textSecondary: "#2A4020", textTertiary: "#7A9070", accent: "#224418", accentSecondary: "#3A6828", stampActive: "#224418", stampActiveIcon: "#F2EEE4", stampInactive: "#D4CEBC", border: "#C4C0A8", borderStrong: "#A4A088", qrBackground: "#FFFFFF", qrForeground: "#0E1A0A", rewardBackground: "#E4DED0" } },
  { id: "black-gold", name: "Black / Gold", tokens: { background: "#0A0A08", surface: "#181610", surfaceSecondary: "#242018", text: "#F0E8C0", textSecondary: "#C0A030", textTertiary: "#605010", accent: "#C0A030", accentSecondary: "#E0C050", stampActive: "#C0A030", stampActiveIcon: "#0A0A08", stampInactive: "#242018", border: "#2A2410", borderStrong: "#403800", qrBackground: "#F0E8C0", qrForeground: "#0A0A08", rewardBackground: "#181610" } },
  { id: "olive-sand", name: "Olive / Sand", tokens: { background: "#E8E4CC", surface: "#D8D4B8", surfaceSecondary: "#C8C4A0", text: "#141208", textSecondary: "#484020", textTertiary: "#888060", accent: "#586020", accentSecondary: "#788030", stampActive: "#586020", stampActiveIcon: "#E8E4CC", stampInactive: "#C8C4A0", border: "#B8B490", borderStrong: "#989470", qrBackground: "#FFFFFF", qrForeground: "#141208", rewardBackground: "#D8D4B8" } },
];

const template: CardTemplate = {
  id: "31-botanica", name: "BOTANICA", subtitle: "Luxury Botanical",
  description: "Feuilles très fines, ornements symétriques, serif élégante.",
  categories: ["nature", "luxury", "beauty"],
  palettes, defaultPaletteId: "forest-cream",
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
        {/* Ornement botanique SVG — nature opacity 0.09 */}
        <svg style={{ position: "absolute", right: thumbnail ? "2%" : "3%", top: "50%", transform: "translateY(-50%)", opacity: 0.09, pointerEvents: "none" }} width={thumbnail ? 30 : 55} height={thumbnail ? 75 : 145} viewBox="0 0 55 145" fill="none">
          <line x1="27" y1="0" x2="27" y2="145" stroke={tokens.accent} strokeWidth="1"/>
          <path d="M27 25 C8 15 4 34 12 43 C20 52 27 43 27 43" fill={tokens.accent}/>
          <path d="M27 25 C46 15 50 34 42 43 C34 52 27 43 27 43" fill={tokens.accent}/>
          <path d="M27 65 C8 55 4 74 12 83 C20 92 27 83 27 83" fill={tokens.accent}/>
          <path d="M27 65 C46 55 50 74 42 83 C34 92 27 83 27 83" fill={tokens.accent}/>
          <path d="M27 105 C14 95 12 112 18 118 C24 124 27 118 27 118" fill={tokens.accent}/>
          <path d="M27 105 C40 95 42 112 36 118 C30 124 27 118 27 118" fill={tokens.accent}/>
        </svg>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: thumbnail ? "6% 7% 3%" : `${7*fmtV}% 8% ${4*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 5 : 8, objectFit: "cover" }}/>
            ) : (
              <div style={{ width: logoSz, height: logoSz, borderRadius: thumbnail ? 5 : 8, background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.stampActiveIcon }}>{(data.nom[0] || "W").toUpperCase()}</span>
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
            style={(dims?.stampStyle ?? "star")} tokens={tokens}
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
