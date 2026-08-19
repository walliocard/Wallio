import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";
import ProgressiveStamps from "../components/ProgressiveStamps";

const palettes: CardPalette[] = [
  {
    id: "cream-red", name: "Cream / Red",
    tokens: {
      background: "#FAF5E8", surface: "#F0E8D0", surfaceSecondary: "#E0D8B8",
      text: "#1A1008", textSecondary: "#5A4A30", textTertiary: "#9A8A68",
      accent: "#CC2020", accentSecondary: "#EE3030",
      stampActive: "#CC2020", stampActiveIcon: "#FAF5E8", stampInactive: "#E0D8B8",
      border: "#E0D8B8", borderStrong: "#C8C0A0",
      qrBackground: "#FFFFFF", qrForeground: "#1A1008",
      rewardBackground: "#F0E8D0",
    },
  },
  {
    id: "black-cream", name: "Black / Cream",
    tokens: {
      background: "#0E0E0C", surface: "#1E1E18", surfaceSecondary: "#2E2E28",
      text: "#F5F0E0", textSecondary: "#C0B898", textTertiary: "#706850",
      accent: "#F5F0E0", accentSecondary: "#C0B898",
      stampActive: "#F5F0E0", stampActiveIcon: "#0E0E0C", stampInactive: "#2E2E28",
      border: "#2E2E28", borderStrong: "#404038",
      qrBackground: "#F5F0E0", qrForeground: "#0E0E0C",
      rewardBackground: "#1E1E18",
    },
  },
  {
    id: "yellow-black", name: "Yellow / Black",
    tokens: {
      background: "#F5D800", surface: "#E8CC00", surfaceSecondary: "#D8BC00",
      text: "#0A0A08", textSecondary: "#303020", textTertiary: "#606040",
      accent: "#0A0A08", accentSecondary: "#303020",
      stampActive: "#0A0A08", stampActiveIcon: "#F5D800", stampInactive: "#D8BC00",
      border: "#C8AC00", borderStrong: "#A89000",
      qrBackground: "#FFFFFF", qrForeground: "#0A0A08",
      rewardBackground: "#E8CC00",
    },
  },
];

const template: CardTemplate = {
  id: "27-ticket",
  name: "TICKET",
  subtitle: "Vintage Ticket",
  description: "Ticket ancien, perforations visuelles, cases de tampons, numéro de membre.",
  categories: ["retro", "artistic", "editorial"],
  palettes,
  defaultPaletteId: "cream-red",
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
        {/* Perforations haut — ticket */}
        <div style={{ position: "absolute", top: thumbnail ? 4 : 7, left: 0, right: 0, display: "flex", gap: thumbnail ? 6 : 10, justifyContent: "center", zIndex: 2 }}>
          {Array.from({ length: thumbnail ? 16 : 28 }).map((_, i) => (
            <div key={i} style={{ width: thumbnail ? 3 : 5, height: thumbnail ? 3 : 5, borderRadius: "50%", background: tokens.surface }}/>
          ))}
        </div>
        {/* Perforations bas */}
        <div style={{ position: "absolute", bottom: thumbnail ? 4 : 7, left: 0, right: 0, display: "flex", gap: thumbnail ? 6 : 10, justifyContent: "center", zIndex: 2 }}>
          {Array.from({ length: thumbnail ? 16 : 28 }).map((_, i) => (
            <div key={i} style={{ width: thumbnail ? 3 : 5, height: thumbnail ? 3 : 5, borderRadius: "50%", background: tokens.surface }}/>
          ))}
        </div>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: thumbnail ? "8% 7% 3%" : `${9*fmtV}% 8% ${4*fmtV}%`, position: "relative", zIndex: 1 }}>
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
          <div style={{ background: `${tokens.accent}18`, backdropFilter: "blur(8px)", borderRadius: 20, padding: thumbnail ? "1px 5px" : "2px 8px", border: `1px solid ${tokens.accent}25`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
            style={(dims?.stampStyle ?? "badge")} tokens={tokens}
            size={thumbnail ? 9 : 20} gap={thumbnail ? 3 : 6} perRow={9}/>
        </div>
          )}

        {/* FOOTER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: thumbnail ? "3% 7% 8%" : `${4*fmtV}% 8% ${9*fmtV}%`, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: thumbnail ? 4 : rs(6), color: tokens.textTertiary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>Récompense</div>
            <div style={{ fontSize: thumbnail ? 6 : rs(10), fontWeight: 600, color: tokens.text }}>{data.nom_recompense}</div>
          </div>
          <div style={{ background: `${tokens.accent}15`, backdropFilter: "blur(8px)", borderRadius: 12, padding: thumbnail ? "2px 5px" : "4px 10px", border: `1px solid ${tokens.accent}20` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: thumbnail ? 6 : ss(11), fontWeight: 700, lineHeight: 1, color: tokens.accent }}>{filled}/{data.objectif_tampons}</span>
            </div>

            {!thumbnail && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 5, letterSpacing: "0.12em", color: tokens.textTertiary, textTransform: "uppercase" as const, marginBottom: 1 }}>Titulaire</div>
                <div style={{ fontSize: ss(9), fontWeight: 600, color: tokens.text }}>
                  {data.client_prenom ? `${data.client_prenom} ${data.client_nom || ""}`.trim() : "Prénom Nom"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
};

export default template;
