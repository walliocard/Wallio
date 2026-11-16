"use client";
export default function AppTest() {
  return (
    <html>
      <body style={{ fontFamily: "sans-serif", padding: 40, background: "#fff" }}>
        <h1 style={{ color: "#007AFF" }}>Wallio OK</h1>
        <p>WKWebView charge cette page correctement.</p>
        <p style={{ marginTop: 32 }}>
          <a
            href="/dashboard"
            style={{
              display: "inline-block", padding: "14px 28px",
              background: "#007AFF", color: "#fff",
              borderRadius: 12, fontSize: 16, fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Ouvrir /dashboard
          </a>
        </p>
        <p style={{ marginTop: 16 }}>
          <a
            href="/dashboard/auth"
            style={{
              display: "inline-block", padding: "14px 28px",
              background: "#8B5CF6", color: "#fff",
              borderRadius: 12, fontSize: 16, fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Ouvrir /dashboard/auth
          </a>
        </p>
      </body>
    </html>
  );
}
