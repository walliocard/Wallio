"use client";

import { useEffect } from "react";

export default function GlobalError({
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
          type: "global-error-boundary",
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
    <html lang="fr">
      <body
        style={{
          background: "#0a0a0a",
          color: "#f5f5f5",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "32px 20px",
          margin: 0,
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>!</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Erreur inattendue
          </h1>
          <p style={{ fontSize: 14, color: "#999", marginBottom: 24 }}>
            L&apos;application a rencontré un problème.
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
      </body>
    </html>
  );
}
