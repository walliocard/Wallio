"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isNative = typeof window !== "undefined" && "Capacitor" in window;

  useEffect(() => {
    if (!isNative) return;
    try {
      fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "dashboard-error-boundary",
          name: error.name,
          message: error.message,
          digest: error.digest,
          stack: error.stack?.slice(0, 800),
          url: window.location.href,
          ua: navigator.userAgent,
        }),
      }).catch(() => {});
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0a0a0a",
        color: "#f5f5f5",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "32px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>!</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Erreur
        </h2>
        <p style={{ fontSize: 14, color: "#999", marginBottom: 24 }}>
          Une erreur est survenue dans l&apos;application.
        </p>

        {isNative && (
          <pre
            style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              padding: 12,
              fontSize: 10,
              color: "#ff6b6b",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              marginBottom: 24,
              overflowX: "auto",
            }}
          >
            {JSON.stringify(
              {
                name: error.name,
                message: error.message,
                digest: error.digest,
                stack: error.stack?.slice(0, 800),
              },
              null,
              2
            )}
          </pre>
        )}

        <button
          onClick={reset}
          style={{
            width: "100%",
            height: 50,
            background: "#2F7BFF",
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
