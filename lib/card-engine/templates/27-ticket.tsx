import type { CardTemplate, CardPalette } from "../types";
import QRBox from "../components/QRBox";
import Stamps from "../components/Stamps";

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
    const memberNum = "0042";
    return (
      <div style={{
        width: "100%", height: "100%", background: tokens.background,
        display: "flex", position: "relative",
        fontFamily: "'Courier New', Courier, monospace",
        overflow: "hidden",
      }}>
        {/* Perforations simulées haut */}
        <div style={{ position: "absolute", top: thumbnail ? 4 : 7, left: 0, right: 0, display: "flex", gap: thumbnail ? 5 : 8, justifyContent: "center" }}>
          {Array.from({ length: thumbnail ? 20 : 35 }).map((_, i) => (
            <div key={i} style={{ width: thumbnail ? 3 : 5, height: thumbnail ? 3 : 5, borderRadius: "50%", background: tokens.surface }}/>
          ))}
        </div>

        {/* Zone détachable gauche */}
        <div style={{
          width: "22%", borderRight: `2px dashed ${tokens.borderStrong}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "10% 2%",
        }}>
          <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: thumbnail ? 5 : 7, letterSpacing: "0.15em", color: tokens.textTertiary }}>
            N° {memberNum}
          </div>
          
        </div>

        {/* Zone principale */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "10% 5% 8%" }}>
          <div>
            <div style={{ fontSize: thumbnail ? 5 : 7, letterSpacing: "0.2em", color: tokens.accent, fontWeight: 700 }}>
              {(data.nom || "ÉTABLISSEMENT").toUpperCase()}
            </div>
            <div style={{ fontSize: thumbnail ? 4 : 6, letterSpacing: "0.1em", color: tokens.textTertiary, marginTop: 2 }}>
              CARTE DE FIDÉLITÉ — MEMBRE
            </div>
            {data.slogan && !thumbnail && <div style={{ fontSize: 7, color: tokens.textTertiary, marginTop: 3, fontStyle: "italic", fontWeight: 400 }}>{data.slogan}</div>}
          </div>

          {/* Cases tampons style ticket */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: thumbnail ? 2 : 4 }}>
            {Array.from({ length: data.objectif_tampons }).map((_, i) => (
              <div key={i} style={{
                width: thumbnail ? 9 : 16, height: thumbnail ? 9 : 16,
                border: `1px solid ${i < filled ? tokens.accent : tokens.borderStrong}`,
                background: i < filled ? `${tokens.accent}20` : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {i < filled && (
                  <div style={{ width: thumbnail ? 4 : 7, height: thumbnail ? 4 : 7, background: tokens.accent, borderRadius: "50%" }}/>
                )}
              </div>
            ))}
          </div>

          <div style={{ fontSize: thumbnail ? 5 : 7, color: tokens.textSecondary }}>
            {filled}/{data.objectif_tampons} — {data.nom_recompense}
          </div>
        </div>

        {/* Perforations bas */}
        <div style={{ position: "absolute", bottom: thumbnail ? 4 : 7, left: 0, right: 0, display: "flex", gap: thumbnail ? 5 : 8, justifyContent: "center" }}>
          {Array.from({ length: thumbnail ? 20 : 35 }).map((_, i) => (
            <div key={i} style={{ width: thumbnail ? 3 : 5, height: thumbnail ? 3 : 5, borderRadius: "50%", background: tokens.surface }}/>
          ))}
        </div>
      </div>
    );
  },
};

export default template;
