"use client";
import { useEffect } from "react";

export default function AppTest() {
  useEffect(() => {
    // Redirect to /dashboard after 1.5s — tests if /dashboard loads from JS navigation
    const t = setTimeout(() => { window.location.replace("/dashboard"); }, 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <html>
      <body style={{ fontFamily: "sans-serif", padding: 40, background: "#F7F7FA" }}>
        <h1 style={{ color: "#007AFF" }}>Wallio OK</h1>
        <p style={{ color: "#555" }}>Redirection vers /dashboard dans 1.5s...</p>
      </body>
    </html>
  );
}
