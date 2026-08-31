export default function WallioLogo({ size = 32, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {!color && (
        <defs>
          <linearGradient id="wGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#007AFF"/>
            <stop offset="50%" stopColor="#5E5CE6"/>
            <stop offset="100%" stopColor="#BF5AF2"/>
          </linearGradient>
        </defs>
      )}
      <text
        x="50" y="82"
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif"
        fontWeight="800"
        fontSize="88"
        fill={color ?? "url(#wGrad)"}
      >W</text>
    </svg>
  );
}
