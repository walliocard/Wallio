"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppTest() {
  const router = useRouter();

  useEffect(() => {
    // router.replace uses History API — NOT intercepted by Capacitor nav policy
    // window.location.replace IS intercepted → opens Safari
    const t = setTimeout(() => { router.replace("/dashboard"); }, 1500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <html>
      <body style={{ fontFamily: "sans-serif", padding: 40, background: "#F7F7FA" }}>
        <h1 style={{ color: "#007AFF" }}>Wallio OK</h1>
        <p style={{ color: "#555" }}>router.replace vers /dashboard dans 1.5s...</p>
      </body>
    </html>
  );
}
