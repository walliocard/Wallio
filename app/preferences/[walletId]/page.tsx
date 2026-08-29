"use client";

import { use, useEffect, useState } from "react";
import { registerFcmToken } from "@/lib/fcm";
import { useTimeTheme } from "@/hooks/useTimeTheme";

export default function PreferencesPage({ params }: { params: Promise<{ walletId: string }> }) {
  const { walletId } = use(params);
  useTimeTheme("light");

  const [notifActive, setNotifActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if ("Notification" in window) {
      setNotifActive(Notification.permission === "granted");
    }
  }, []);

  async function desactiver() {
    setLoading(true);
    await fetch("/api/client-notif", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletId, fcm_token: null }),
    });
    setNotifActive(false);
    setLoading(false);
    setDone(true);
  }

  async function reactiver() {
    if (!("Notification" in window)) return;
    setLoading(true);
    const perm = await Notification.requestPermission();
    if (perm !== "granted") { setLoading(false); return; }
    const token = await registerFcmToken();
    if (token) {
      await fetch("/api/client-notif", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId, fcm_token: token }),
      });
      setNotifActive(true);
      setDone(true);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-5" style={{ background: "#F5F5F7" }}>
      <div className="w-full max-w-[390px] mx-auto">

        <div className="rounded-[28px] p-7" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>

          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "rgba(0,122,255,0.08)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </div>

          <h1 className="text-[20px] font-semibold tracking-tight mb-1" style={{ color: "#1D1D1F" }}>
            Notifications
          </h1>
          <p className="text-[14px] mb-7" style={{ color: "#6E6E73" }}>
            {notifActive === null
              ? "Vérification en cours..."
              : notifActive
                ? "Vous recevez actuellement les notifications de cet établissement."
                : "Vous ne recevez plus les notifications de cet établissement."}
          </p>

          {done ? (
            <div className="rounded-2xl py-3 px-4 text-center" style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.2)" }}>
              <p className="text-[14px] font-medium" style={{ color: "#34C759" }}>
                {notifActive ? "Notifications réactivées." : "Notifications désactivées."}
              </p>
            </div>
          ) : notifActive ? (
            <button onClick={desactiver} disabled={loading}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold transition-opacity active:opacity-70"
              style={{ background: "rgba(255,59,48,0.08)", color: "#FF3B30" }}>
              {loading ? "En cours..." : "Désactiver les notifications"}
            </button>
          ) : notifActive === false ? (
            <button onClick={reactiver} disabled={loading}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white transition-opacity active:opacity-70"
              style={{ background: "linear-gradient(135deg, #007AFF, #8B5CF6)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
              {loading ? "En cours..." : "Réactiver les notifications"}
            </button>
          ) : null}
        </div>

        <p className="text-center text-[12px] mt-5" style={{ color: "#86868B" }}>
          Wallio · Programme de fidélité
        </p>
      </div>
    </main>
  );
}
