interface WallioIconProps {
  size?: number;
  className?: string;
}

export default function WallioIcon({ size = 48, className }: WallioIconProps) {
  return (
    <img
      src="/icon.svg"
      width={size}
      height={size}
      alt="Wallio"
      className={className}
      style={{ flexShrink: 0, display: "block" }}
    />
  );
}
