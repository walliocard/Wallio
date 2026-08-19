import type { CardTokens, Palier } from "../types";
import Stamps from "./Stamps";
import type { StampStyle } from "./Stamps";

interface Props {
  paliers: Palier[];
  palier_actuel: number;         // index 0-based
  paliers_valides: boolean[];
  tampons: number;               // tampons en cours dans le palier actuel
  tokens: CardTokens;
  stampStyle?: StampStyle;
  stampSize?: number;
  thumbnail?: boolean;
}

export default function ProgressiveStamps({
  paliers, palier_actuel, paliers_valides, tampons,
  tokens, stampStyle, stampSize, thumbnail,
}: Props) {
  const current = paliers[palier_actuel];
  const palierAtteint = current && tampons >= current.tampons;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: thumbnail ? 4 : 8 }}>

      {/* ── Roadmap ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
        {paliers.map((p, i) => {
          const valide = paliers_valides?.[i] ?? false;
          const actuel = i === palier_actuel;
          const futur  = i > palier_actuel;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
              {/* Nœud */}
              <div style={{
                width: thumbnail ? 14 : 26, height: thumbnail ? 14 : 26,
                borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: valide ? tokens.stampActive
                  : actuel ? `${tokens.accent}22`
                  : tokens.stampInactive,
                border: `${thumbnail ? 1 : 1.5}px solid ${valide || actuel ? tokens.accent : tokens.border}`,
                transition: "all 0.3s ease",
              }}>
                {valide ? (
                  <svg width={thumbnail ? 7 : 12} height={thumbnail ? 7 : 12} viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke={tokens.stampActiveIcon} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span style={{ fontSize: thumbnail ? 5 : 9, fontWeight: 700, color: actuel ? tokens.accent : tokens.textTertiary }}>
                    {i + 1}
                  </span>
                )}
              </div>

              {/* Ligne de connexion */}
              {i < paliers.length - 1 && (
                <div style={{ flex: 1, height: thumbnail ? 1 : 1.5, position: "relative", margin: "0 2px" }}>
                  <div style={{ position: "absolute", inset: 0, background: tokens.border }}/>
                  {(valide || actuel) && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: tokens.accent, opacity: valide ? 1 : 0.35,
                    }}/>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Labels des paliers */}
      {!thumbnail && (
        <div style={{ display: "flex", width: "100%" }}>
          {paliers.map((p, i) => {
            const valide = paliers_valides?.[i] ?? false;
            const actuel = i === palier_actuel;
            return (
              <div key={i} style={{ flex: 1, minWidth: 0, paddingRight: i < paliers.length - 1 ? 4 : 0 }}>
                <div style={{
                  fontSize: 7, fontWeight: actuel ? 600 : 400,
                  color: valide ? tokens.accent : actuel ? tokens.text : tokens.textTertiary,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {valide ? "✓ " : ""}{p.recompense}
                </div>
                <div style={{ fontSize: 6, color: tokens.textTertiary, marginTop: 1 }}>
                  {valide ? "Réclamé" : actuel ? `${tampons}/${p.tampons}` : `${p.tampons} pts`}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tampons du palier actuel */}
      {current && (
        <Stamps
          fillWidth={!thumbnail}
          sizeOverride={!thumbnail ? stampSize : undefined}
          total={current.tampons}
          filled={Math.min(tampons, current.tampons)}
          style={stampStyle ?? "circle"}
          tokens={tokens}
          size={thumbnail ? 7 : 18}
          gap={thumbnail ? 2 : 5}
          perRow={10}
        />
      )}

      {/* ── Bandeau annonce palier atteint ── */}
      {palierAtteint && !thumbnail && (
        <div style={{
          background: `${tokens.accent}15`,
          border: `1px solid ${tokens.accent}40`,
          borderRadius: 10,
          padding: "6px 10px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>🎉</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: tokens.accent }}>
              Palier {palier_actuel + 1} atteint !
            </div>
            <div style={{ fontSize: 9, color: tokens.text, marginTop: 1 }}>
              {current.recompense} — à réclamer en caisse
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
