"use client";

import { useEffect, useState } from "react";

export default function PasskeyRegisterBanner({ telephone }: { telephone: string }) {
  const [state, setState] = useState<"checking" | "idle" | "loading" | "done" | "hidden">("checking");
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (!telephone) { setState("hidden"); return; }
    setIsAndroid(/android/i.test(navigator.userAgent));
    async function check() {
      const { isPasskeySupported, isPasskeyRegistered } = await import("@/lib/passkey-client");
      if (!(await isPasskeySupported())) { setState("hidden"); return; }
      const registered = await isPasskeyRegistered(telephone);
      setState(registered ? "hidden" : "idle");
    }
    check();
  }, [telephone]);

  if (state === "checking" || state === "hidden") return null;

  const label = isAndroid ? "Empreinte digitale" : "FaceID";

  async function handleRegister() {
    setState("loading");
    try {
      const { registerPasskey } = await import("@/lib/passkey-client");
      const ok = await registerPasskey(telephone);
      setState(ok ? "done" : "idle");
      if (ok) setTimeout(() => setState("hidden"), 2000);
    } catch {
      setState("idle");
    }
  }

  return (
    <div style={{
      borderRadius: 20, padding: "18px 18px", marginBottom: 14,
      background: "rgba(0,122,255,0.06)", border: "1px solid rgba(0,122,255,0.15)",
    }}>
      {state === "done" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l3.5 3.5L13 4" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#34C759", margin: 0 }}>{label} enregistré</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#1C2333", margin: "0 0 4px" }}>Ne perdez jamais vos tampons</p>
          <p style={{ fontSize: 13, color: "#8E9BB5", margin: "0 0 14px", lineHeight: 1.5 }}>
            Sauvegardez avec {label} pour vous reconnaître instantanément à chaque visite.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleRegister}
              disabled={state === "loading"}
              style={{
                flex: 1, padding: "12px", borderRadius: 14, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg,#007AFF,#8B5CF6)", color: "white",
                fontSize: 14, fontWeight: 600,
                opacity: state === "loading" ? 0.7 : 1,
              }}>
              {state === "loading" ? "Enregistrement…" : `Sauvegarder avec ${label}`}
            </button>
            <button
              onClick={() => setState("hidden")}
              style={{
                padding: "12px 16px", borderRadius: 14, border: "none", cursor: "pointer",
                background: "rgba(0,0,0,0.05)", color: "#8E9BB5", fontSize: 14, fontWeight: 500,
              }}>
              Plus tard
            </button>
          </div>
        </>
      )}
    </div>
  );
}
