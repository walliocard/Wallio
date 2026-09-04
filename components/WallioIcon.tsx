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
        background: "#ffffff",
        border: "1.5px solid rgba(0,0,0,0.06)",
        boxShadow: "0 4px 16px rgba(91,124,250,0.14)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <WallioLogo size={Math.round(size * 0.68)} />
    </div>
  );
}
