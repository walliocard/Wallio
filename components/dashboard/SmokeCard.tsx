"use client";

import type React from "react";

const CSS_ID = "wallio-smoke-card";

function injectCSS() {
  if (typeof document === "undefined" || document.getElementById(CSS_ID)) return;
  const s = document.createElement("style");
  s.id = CSS_ID;
  s.textContent = [
    "@keyframes smoke-blob-a { to { transform: translate(14px,10px); } }",
    "@keyframes smoke-blob-b { to { transform: translate(-12px,-14px); } }",
    "@media (prefers-reduced-motion: reduce) { .smoke-blob { animation: none !important; } }",
  ].join("\n");
  document.head.appendChild(s);
}

export function SmokeCard({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  if (typeof window !== "undefined") injectCSS();

  return (
    <div
      className={className}
      style={{
        borderRadius: 24,
        background: "rgba(255,255,255,0.75)",
        border: "1px solid rgba(255,255,255,0.90)",
        boxShadow: "0 10px 30px rgba(91,92,240,0.12)",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      <div
        className="smoke-blob"
        style={{
          position: "absolute", top: -200, left: -150,
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(47,123,255,0.28) 0%, transparent 65%)",
          animation: "smoke-blob-a 22s ease-in-out infinite alternate",
          willChange: "transform", pointerEvents: "none",
        }}
      />
      <div
        className="smoke-blob"
        style={{
          position: "absolute", bottom: -200, right: -150,
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.24) 0%, transparent 65%)",
          animation: "smoke-blob-b 25s ease-in-out infinite alternate",
          willChange: "transform", pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "inherit", justifyContent: "inherit" }}>
        {children}
      </div>
    </div>
  );
}
