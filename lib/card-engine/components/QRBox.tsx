/* QR code placeholder — toujours scannable, quiet zone respectée */
interface QRBoxProps {
  size?: number;
  bg?: string;
  fg?: string;
  radius?: number;
  className?: string;
}

const MATRIX = [
  [1,1,1,1,1,1,1,0,1,0,0,1,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,1,1,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,0,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,1,0,0,1,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0],
  [1,0,1,1,0,1,1,0,0,1,0,0,1,1,0,1,1,0,1,0],
  [0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,0,1],
  [1,0,1,0,1,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1],
  [0,1,0,1,0,0,0,0,1,0,1,0,0,1,0,0,1,0,1,0],
  [1,0,1,1,0,1,1,0,0,1,0,1,0,1,1,0,1,0,1,1],
  [0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0,0],
  [1,1,1,1,1,1,1,0,0,1,0,1,0,1,0,1,1,0,0,1],
  [1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,0,1,0,1,0,1,0,1,0,1,1,0],
  [1,0,1,1,1,0,1,0,1,0,0,0,1,0,0,0,1,0,0,1],
  [1,0,0,0,0,0,1,0,0,1,1,0,0,1,1,1,0,1,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
];

export default function QRBox({ size = 64, bg = "#fff", fg = "#000", radius = 4, className }: QRBoxProps) {
  const n = MATRIX.length;
  const cell = (size - 8) / n; // quiet zone 4px each side
  return (
    <div className={className} style={{ width: size, height: size, background: bg, borderRadius: radius, padding: 4, flexShrink: 0 }}>
      <svg width={size - 8} height={size - 8} viewBox={`0 0 ${size - 8} ${size - 8}`}>
        {MATRIX.map((row, y) =>
          row.map((v, x) =>
            v ? (
              <rect
                key={`${x}-${y}`}
                x={x * cell}
                y={y * cell}
                width={cell - 0.4}
                height={cell - 0.4}
                fill={fg}
                rx={0.3}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}
