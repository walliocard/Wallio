import type { CardTemplate, CardPalette } from "../types";
import { renderStrip } from "../strip";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  { id: "pink-lavender", name: "Pink / Lavender", tokens: { background: "#FFE8F4", surface: "#FFD0EC", surfaceSecondary: "#FFB8E4", text: "#2A0820", textSecondary: "#8020A0", textTertiary: "#C080D0", accent: "#E030B0", accentSecondary: "#A030C8", stampActive: "#E030B0", stampActiveIcon: "#FFFFFF", stampInactive: "#FFB8E4", border: "#F0C0E8", borderStrong: "#D8A0D0", qrBackground: "#FFFFFF", qrForeground: "#2A0820", rewardBackground: "#FFD0EC" } },
  { id: "peach-mint", name: "Peach / Mint", tokens: { background: "#FFF0E8", surface: "#FFE0D0", surfaceSecondary: "#FFD0B8", text: "#1A0A08", textSecondary: "#208060", textTertiary: "#70B090", accent: "#10A878", accentSecondary: "#20D0A0", stampActive: "#10A878", stampActiveIcon: "#FFFFFF", stampInactive: "#FFD0B8", border: "#F0C8B8", borderStrong: "#D8A890", qrBackground: "#FFFFFF", qrForeground: "#1A0A08", rewardBackground: "#FFE0D0" } },
  { id: "blue-lilac", name: "Blue / Lilac", tokens: { background: "#EEF0FF", surface: "#DDE0FF", surfaceSecondary: "#CCD0FF", text: "#0A0C28", textSecondary: "#4040C0", textTertiary: "#8080D0", accent: "#4848E0", accentSecondary: "#8080FF", stampActive: "#4848E0", stampActiveIcon: "#FFFFFF", stampInactive: "#CCD0FF", border: "#C8D0F8", borderStrong: "#A8B0E8", qrBackground: "#FFFFFF", qrForeground: "#0A0C28", rewardBackground: "#DDE0FF" } },
];

const template: CardTemplate = {
  id: "46-candy", name: "CANDY", subtitle: "Soft Playful",
  description: "Pastels doux, formes rondes, typographie bubbly, bonbons.",
  categories: ["colorful", "beauty", "modern"],
  palettes, defaultPaletteId: "pink-lavender",
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
          <div style={{ position: "absolute", left: "80%", top: "-5%", width: 76, height: 76, borderRadius: "50%", background: tokens.surface, transform: "translate(-50%,-50%)" }}/>
          <div style={{ position: "absolute", left: "10%", top: "80%", width: 56, height: 56, borderRadius: "50%", background: tokens.surfaceSecondary, transform: "translate(-50%,-50%)" }}/>
          <div style={{ position: "absolute", left: "60%", top: "88%", width: 40, height: 40, borderRadius: "50%", background: tokens.surface, transform: "translate(-50%,-50%)" }}/>
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
        {/* Circles décoratifs — colorful/playful */}
        {[
          { x: "80%", y: "-5%", r: thumbnail ? 20 : 38, c: tokens.surface },
          { x: "10%", y: "80%", r: thumbnail ? 14 : 28, c: tokens.surfaceSecondary },
          { x: "60%", y: "88%", r: thumbnail ? 10 : 20, c: tokens.surface },
        ].map((c, i) => (
          <div key={i} style={{ position: "absolute", left: c.x, top: c.y, width: c.r * 2, height: c.r * 2, borderRadius: "50%", background: c.c, transform: "translate(-50%,-50%)" }}/>
        ))}

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: thumbnail ? "6% 7% 3%" : `${7*fmtV}% 8% ${4*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: thumbnail ? 5 : 10 }}>
            {data.logo_url ? (
              <img src={data.logo_url} alt="" style={{ width: logoSz, height: logoSz, borderRadius: "50%", objectFit: "cover" }}/>
            ) : (
              <div style={{ width: logoSz, height: logoSz, borderRadius: "50%", background: tokens.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: thumbnail ? 7 : 12, fontWeight: 700, color: tokens.stampActiveIcon }}>{(data.nom[0] || "W").toUpperCase()}</span>
              </div>
            )}
            <div>
              <div style={{ fontSize: thumbnail ? 8 : ns(13), fontWeight: 700, color: tokens.text, letterSpacing: -0.3, lineHeight: 1.2 }}>{data.nom || "Établissement"}</div>
              {data.slogan && !thumbnail && <div style={{ fontSize: rs(8), color: tokens.textTertiary, marginTop: 2 }}>{data.slogan}</div>}
            </div>
          </div>
          <div style={{ background: tokens.accent, borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: thumbnail ? 4 : 6, fontWeight: 700, letterSpacing: "0.1em", color: "#FFFFFF" }}>WALLIO</span>
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
            style={(dims?.stampStyle ?? "circle")} tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}/>
        </div>
          )}

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: thumbnail ? "3% 7% 6%" : `${4*fmtV}% 8% ${7*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>{data.nom_recompense}</div>
          </div>
          <div style={{ background: `${tokens.accent}18`, backdropFilter: "blur(8px)", borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px", border: `1px solid ${tokens.accent}30` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, lineHeight: 1, color: tokens.accent }}>{filled}/{data.objectif_tampons}</span>
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
