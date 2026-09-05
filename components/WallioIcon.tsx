import WallioLogo from "./WallioLogo";

interface WallioIconProps {
  size?: number;
  className?: string;
}

export default function WallioIcon({ size = 48, className }: WallioIconProps) {
  const radius = Math.round(size * 0.26);
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1.5px solid rgba(255,255,255,0.92)",
        boxShadow: "0 8px 24px rgba(91,124,250,0.18), inset 0 1.5px 0 rgba(255,255,255,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <WallioLogo size={Math.round(size * 0.68)} />
    </div>
  );
}
