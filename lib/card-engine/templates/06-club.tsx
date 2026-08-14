import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

const palettes: CardPalette[] = [
  { id: "navy-gold", name: "Navy / Gold", tokens: { background: "#0A1428", surface: "#162040", surfaceSecondary: "#1E2E54", text: "#F0E8CC", textSecondary: "#C6A040", textTertiary: "#5A4820", accent: "#C6A040", accentSecondary: "#E8C060", stampActive: "#C6A040", stampActiveIcon: "#0A1428", stampInactive: "#1E2E54", border: "#2A3E60", borderStrong: "#4A5E80", qrBackground: "#F0E8CC", qrForeground: "#0A1428", rewardBackground: "#162040" } },
  { id: "forest-cream", name: "Forest / Cream", tokens: { background: "#0E1E14", surface: "#182A1E", surfaceSecondary: "#223828", text: "#F0EAD8", textSecondary: "#C0B080", textTertiary: "#506040", accent: "#C0B080", accentSecondary: "#E0D0A0", stampActive: "#C0B080", stampActiveIcon: "#0E1E14", stampInactive: "#223828", border: "#2A3A28", borderStrong: "#405040", qrBackground: "#F0EAD8", qrForeground: "#0E1E14", rewardBackground: "#182A1E" } },
  { id: "burgundy-ivory", name: "Burgundy / Ivory", tokens: { background: "#1E0810", surface: "#2E1018", surfaceSecondary: "#401420", text: "#F5EDDE", textSecondary: "#C89060", textTertiary: "#604030", accent: "#C89060", accentSecondary: "#E8B080", stampActive: "#C89060", stampActiveIcon: "#1E0810", stampInactive: "#401420", border: "#3A1820", borderStrong: "#5A2A30", qrBackground: "#F5EDDE", qrForeground: "#1E0810", rewardBackground: "#2E1018" } },
];

const template: CardTemplate = {
  id: "06-club", name: "CLUB", subtitle: "Heritage / Private Club",
  description: "Club privé, monogramme, typographie serif, badge de fidélité.",
  categories: ["luxury", "premium", "barber"],
  palettes, defaultPaletteId: "navy-gold",
  render({ data, tokens, thumbnail }) {
    const filled = Math.round(data.objectif_tampons * 0.6);
    return (
      <div style={{ width: "100%", height: "100%", background: tokens.background, display: "flex", flexDirection: "column", fontFamily: "Georgia, serif", position: "relative", overflow: "hidden" }}>
        {/* Bordure dorée */}
        <div style={{ position: "absolute", inset: thumbnail ? 4 : 8, border: `1px solid ${tokens.border}`, pointerEvents: "none" }}/>
        {/* Filet central horizontal */}
        <div style={{ position: "absolute", top: "50%", left: thumbnail ? 8 : 16, right: thumbnail ? 8 : 16, height: "1px", background: tokens.border, opacity: 0.4 }}/>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: thumbnail ? "10% 9%" : "12% 11%", position: "relative", zIndex: 1 }}>
          {/* Header — logo + nom + badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              {data.logo_url ? (
                <img src={data.logo_url} alt="" style={{ width: thumbnail ? 16 : 26, height: thumbnail ? 16 : 26, borderRadius: "50%", objectFit: "cover", border: `1px solid ${tokens.accent}` }}/>
              ) : (
                <div style={{ width: thumbnail ? 18 : 30, height: thumbnail ? 18 : 30, borderRadius: "50%", border: `1.5px solid ${tokens.accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: thumbnail ? 8 : 14, color: tokens.accent, fontWeight: 700 }}>{(data.nom[0] || "C").toUpperCase()}</span>
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.2em", color: tokens.accent }}>MEMBER</div>
              <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.2em", color: tokens.textTertiary }}>REWARD</div>
            </div>
          </div>

          {/* Nom centré — typographie serif élégante */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: thumbnail ? 8 : 14, fontWeight: 700, color: tokens.text, fontStyle: "italic", letterSpacing: 1 }}>
              {data.nom || "The Club"}
            </div>
            {data.slogan && !thumbnail && <div style={{ fontSize: 8, color: tokens.textTertiary, marginTop: 2, fontStyle: "italic", fontWeight: 400, letterSpacing: "normal", textTransform: "none" }}>{data.slogan}</div>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 }}>
              <div style={{ height: 1, width: thumbnail ? 10 : 20, background: tokens.accent, opacity: 0.5 }}/>
              <div style={{ width: 3, height: 3, borderRadius: "50%", background: tokens.accent }}/>
              <div style={{ height: 1, width: thumbnail ? 10 : 20, background: tokens.accent, opacity: 0.5 }}/>
            </div>
          </div>

          {/* Tampons */}
          <Stamps fillWidth={!thumbnail} total={data.objectif_tampons} filled={filled} style="badge" tokens={tokens} size={thumbnail ? 9 : 16} gap={thumbnail ? 3 : 5} perRow={8}/>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: thumbnail ? 5 : 8, color: tokens.textSecondary }}>{filled}/{data.objectif_tampons} · {data.nom_recompense}</div>
          </div>
        </div>
      </div>
    );
  },
};
export default template;
