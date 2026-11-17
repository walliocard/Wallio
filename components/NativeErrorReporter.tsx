"use client";

import { useEffect, useState } from "react";

function sendToLog(info: Record<string, unknown>) {
  try {
    fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...info,
        url: window.location.href,
        ua: navigator.userAgent,
      }),
    }).catch(() => {});
  } catch {}
}

export default function NativeErrorReporter() {
  const [entries, setEntries] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Capacitor" in window)) return;

    const push = (info: Record<string, unknown>) => {
      sendToLog(info);
      setEntries(prev => [...prev.slice(-9), JSON.stringify(info, null, 2)]);
    };

    const prevOnerror = window.onerror;
    window.onerror = (msg, src, line, col, err) => {
      push({
        type: "onerror",
        msg: String(msg),
        src,
        line,
        col,
        name: err?.name,
        message: err?.message,
        stack: err?.stack?.slice(0, 600),
      });
      return typeof prevOnerror === "function"
        ? prevOnerror(msg, src, line, col, err)
        : false;
    };

    const onUnhandled = (e: PromiseRejectionEvent) => {
      const err = e.reason;
      push({
        type: "unhandledrejection",
        name: err?.name,
        message: err?.message ?? String(err),
        stack: err?.stack?.slice(0, 600),
      });
    };

    window.addEventListener("unhandledrejection", onUnhandled);
    return () => {
      window.onerror = prevOnerror;
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, []);

  if (!entries.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        background: "#0d0d0d",
        color: "#ff6b6b",
        fontFamily: "monospace",
        fontSize: 10,
        padding: "8px 12px",
        maxHeight: "45vh",
        overflowY: "auto",
        borderTop: "2px solid #ff4444",
      }}
    >
      <div style={{ color: "#ff4444", fontWeight: "bold", marginBottom: 6, fontSize: 12 }}>
        Native JS errors ({entries.length})
      </div>
      {entries.map((e, i) => (
        <pre
          key={i}
          style={{
            margin: "0 0 8px",
            padding: "6px 8px",
            background: "#1a1a1a",
            borderRadius: 4,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {e}
        </pre>
      ))}
    </div>
  );
}
