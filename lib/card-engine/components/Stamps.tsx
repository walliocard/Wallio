import type { CardTokens } from "../types";

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

export default function Stamps({
  total, filled, style, tokens, size = 22, gap = 5, perRow = 9, iconPath,
}: StampsProps) {
  const rows: number[][] = [];
  for (let i = 0; i < total; i += perRow) {
    rows.push(Array.from({ length: Math.min(perRow, total - i) }, (_, j) => i + j));
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
