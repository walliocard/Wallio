import type { ReactElement, ReactNode } from "react";
import type { CardData, CardTokens } from "./types";

interface StripOptions {
  background?: string;
  extraStyle?: React.CSSProperties;
  decoratives?: ReactNode;
}

export function renderStrip(
  data: CardData,
  tokens: CardTokens,
  opts: StripOptions = {},
): ReactElement {
  const { background = tokens.background, extraStyle, decoratives } = opts;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background,
        position: "relative",
        overflow: "hidden",
        fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
        ...extraStyle,
      }}
    >
      {decoratives}
      {/* Identité marchand — bas gauche */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {data.logo_url && (
          <img
            src={data.logo_url}
            alt=""
            style={{
              height: 28,
              maxWidth: 80,
              objectFit: "contain",
              borderRadius: 5,
              flexShrink: 0,
            }}
          />
        )}
        {data.nom && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: tokens.text,
              letterSpacing: -0.3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 220,
            }}
          >
            {data.nom}
          </span>
        )}
      </div>
    </div>
  );
}
