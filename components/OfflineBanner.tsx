"use client";
import { useState, useEffect } from "react";

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => { setOnline(true); setTimeout(() => setVisible(false), 2000); };
    const off = () => { setOnline(false); setVisible(true); };
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  if (online && !visible) return null;

  return (
    <div style={{
      position: "fixed",
      top: "calc(env(safe-area-inset-top, 0px) + 10px)",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      background: online ? "rgba(52,199,89,0.92)" : "rgba(30,30,32,0.92)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      padding: "9px 16px",
      borderRadius: 100,
      animation: "toast-in 0.25s ease",
      whiteSpace: "nowrap",
      boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
    }}>
      <p style={{ color: "white", fontSize: 13, fontWeight: 600 }}>
        {online ? "Connexion rétablie" : "Pas de connexion · les scans seront synchronisés"}
      </p>
    </div>
  );
}
