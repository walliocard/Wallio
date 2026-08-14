import type { CardTokens } from "../types";

/* Stamp qui remplit sa cellule (utilisé en mode fillWidth) */
function FillStampShape({ filled, style, tokens, iconPath }: {
  filled: boolean; style: StampStyle; tokens: CardTokens; iconPath?: string;
}) {
  const bg = filled ? tokens.stampActive : tokens.stampInactive;
  const fg = filled ? tokens.stampActiveIcon : tokens.stampInactive;
  const base: React.CSSProperties = { width: "78%", height: "78%", flexShrink: 0 };

  switch (style) {
    case "dot":
      return <div style={{ ...base, width: "50%", height: "50%", borderRadius: "50%", background: bg }}/>;
    case "square":
      return <div style={{ ...base, background: bg }}/>;
    case "rounded":
      return <div style={{ ...base, borderRadius: "22%", background: bg }}/>;
    case "diamond":
      return <div style={{ ...base, width: "65%", height: "65%", background: bg, transform: "rotate(45deg)" }}/>;
    case "ring":
      return <div style={{ ...base, borderRadius: "50%", border: `2px solid ${filled ? tokens.stampActive : tokens.stampInactive}`, background: filled ? `${tokens.stampActive}22` : "transparent" }}/>;
    case "stripe":
      return <div style={{ width: "90%", height: "35%", borderRadius: 4, background: bg }}/>;
    case "star":
      return (
        <svg width="78%" height="78%" viewBox="0 0 24 24" style={{ display: "block" }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={filled ? tokens.stampActive : tokens.stampInactive}/>
        </svg>
      );
    case "badge":
      return (
        <div style={{ ...base, borderRadius: "18%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {filled && <svg width="55%" height="55%" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>}
        </div>
      );
    default: // circle
      return <div style={{ ...base, borderRadius: "50%", background: bg }}/>;
  }
}

export type StampStyle =
  | "circle" | "square" | "rounded" | "dot" | "number"
  | "diamond" | "star" | "stripe" | "ring" | "badge";

interface StampsProps {
  total: number;
  filled: number;
  style: StampStyle;
  tokens: CardTokens;
  size?: number;
  gap?: number;
  perRow?: number;
  iconPath?: string;
  fillWidth?: boolean;
}

function StampShape({
  filled, style, tokens, size, iconPath,
}: {
  filled: boolean; style: StampStyle; tokens: CardTokens;
  size: number; iconPath?: string;
}) {
  const bg = filled ? tokens.stampActive : tokens.stampInactive;
  const fg = filled ? tokens.stampActiveIcon : tokens.stampInactive;

  switch (style) {
    case "dot":
      return (
        <div style={{
          width: size * 0.55, height: size * 0.55, borderRadius: "50%",
          background: filled ? tokens.stampActive : tokens.stampInactive,
          flexShrink: 0,
        }}/>
      );
    case "square":
      return (
        <div style={{
          width: size, height: size, background: bg, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {filled && iconPath && (
            <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none"
              stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={iconPath}/>
            </svg>
          )}
        </div>
      );
    case "rounded":
      return (
        <div style={{
          width: size, height: size, borderRadius: size * 0.28, background: bg,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {filled && iconPath && (
            <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none"
              stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={iconPath}/>
            </svg>
          )}
        </div>
      );
    case "ring":
      return (
        <div style={{
          width: size, height: size, borderRadius: "50%", flexShrink: 0,
          border: `${size * 0.12}px solid ${filled ? tokens.stampActive : tokens.stampInactive}`,
          background: filled ? `${tokens.stampActive}22` : "transparent",
        }}/>
      );
    case "diamond":
      return (
        <div style={{
          width: size * 0.85, height: size * 0.85, flexShrink: 0,
          background: bg, transform: "rotate(45deg)",
        }}/>
      );
    case "stripe":
      return (
        <div style={{
          width: size * 1.6, height: size * 0.35, flexShrink: 0,
          borderRadius: size * 0.18,
          background: filled ? tokens.stampActive : tokens.stampInactive,
        }}/>
      );
    case "star":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={filled ? tokens.stampActive : tokens.stampInactive}
          />
        </svg>
      );
    case "badge":
      return (
        <div style={{
          width: size * 1.3, height: size * 0.75, borderRadius: size * 0.12, flexShrink: 0,
          background: bg,
          border: `1px solid ${filled ? tokens.stampActive : tokens.stampInactive}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {filled && (
            <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="none"
              stroke={fg} strokeWidth="2.5" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          )}
        </div>
      );
    default: // circle
      return (
        <div style={{
          width: size, height: size, borderRadius: "50%", background: bg, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {filled && iconPath && (
            <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none"
              stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={iconPath}/>
            </svg>
          )}
        </div>
      );
  }
}

function balancedPerRow(total: number): number {
  if (total <= 8) return total;          // 1 ligne pour ≤8
  if (total <= 16) return Math.ceil(total / 2); // 2 lignes équilibrées
  return Math.ceil(total / 3);           // 3 lignes pour >16
}

export default function Stamps({
  total, filled, style, tokens, size = 22, gap = 5, perRow = 9, iconPath, fillWidth = false,
}: StampsProps) {
  const effectivePerRow = fillWidth ? balancedPerRow(total) : perRow;
  const rows: number[][] = [];
  for (let i = 0; i < total; i += effectivePerRow) {
    rows.push(Array.from({ length: Math.min(effectivePerRow, total - i) }, (_, j) => i + j));
  }

  if (fillWidth) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap, width: "100%" }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: "grid", gridTemplateColumns: `repeat(${row.length}, 1fr)`, gap, width: "100%", alignItems: "center" }}>
            {row.map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "1", minWidth: 0 }}>
                <FillStampShape filled={i < filled} style={style} tokens={tokens} iconPath={iconPath}/>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: "flex", alignItems: "center", gap, flexWrap: "nowrap" }}>
          {row.map(i => (
            <StampShape key={i} filled={i < filled} style={style} tokens={tokens} size={size} iconPath={iconPath}/>
          ))}
        </div>
      ))}
    </div>
  );
}
