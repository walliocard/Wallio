"use client";

import { useEffect, useState } from "react";

export default function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null);

  useEffect(() => {
    // Déjà installé en standalone → on ne montre pas
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as Record<string, unknown>).standalone === true;
    if (standalone) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(ios);

    // Android : intercepter beforeinstallprompt pour prompt natif
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => Promise<void> });
    };
    window.addEventListener("beforeinstallprompt", handler);

    setShow(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() { setShow(false); }

  async function handleAndroidInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
      setShow(false);
    }
  }

  if (!show) return null;

  return (
    <div style={{
      borderRadius: 24, marginBottom: 16, overflow: "hidden",
      background: "linear-gradient(135deg, rgba(91,124,250,0.12) 0%, rgba(124,91,250,0.10) 100%)",
      border: "1px solid rgba(91,124,250,0.25)",
      backdropFilter: "blur(20px)",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/wallio-instagram-profil.png" alt="Wallio" style={{ width: 38, height: 38, borderRadius: 10 }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1C2333", letterSpacing: -0.2 }}>Installez Wallio</p>
            <p style={{ fontSize: 12, color: "#8E9BB5" }}>Gratuit · 2 secondes</p>
          </div>
        </div>
        <button
          onClick={dismiss}
          style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 8, padding: "4px 10px", cursor: "pointer", color: "#8E9BB5", fontSize: 12 }}>
          Plus tard
        </button>
      </div>

      {/* Bénéfices */}
      <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          "Offre d'anniversaire automatique",
          "Offres exclusives de vos établissements",
          "Toutes vos cartes au même endroit",
        ].map(text => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: 99, flexShrink: 0, background: "linear-gradient(135deg,#007AFF,#8B5CF6)" }} />
            <span style={{ fontSize: 13, color: "#1C2333", fontWeight: 500 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div style={{ margin: "0 14px 14px", padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,0.65)", backdropFilter: "blur(12px)" }}>
        {isIos ? (
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#1C2333", marginBottom: 8 }}>Comment installer sur iPhone :</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { n: "1", t: "Appuyez sur le bouton Partager", showIcon: true },
                { n: "2", t: "Faites défiler vers « Sur l'écran d'accueil »", showIcon: false },
                { n: "3", t: "Appuyez sur « Ajouter »", showIcon: false },
              ].map(s => (
                <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(135deg,#5B7CFA,#7C5BFA)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>{s.n}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#6E7A8A" }}>{s.t}</span>
                  {s.showIcon && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6E7A8A" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                      <polyline points="16 6 12 2 8 6"/>
                      <line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : deferredPrompt ? (
          // Android avec prompt natif disponible
          <button
            onClick={handleAndroidInstall}
            style={{
              width: "100%", padding: "12px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#5B7CFA,#7C5BFA)",
              color: "white", fontSize: 14, fontWeight: 600,
            }}>
            Ajouter à l'écran d'accueil
          </button>
        ) : (
          // Android sans prompt (déjà installé ou non supporté)
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#1C2333", marginBottom: 8 }}>Comment installer sur Android :</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                { n: "1", t: "Appuyez sur ⋮ (menu en haut à droite)" },
                { n: "2", t: "Appuyez sur « Ajouter à l'écran d'accueil »" },
                { n: "3", t: "Confirmez avec « Ajouter »" },
              ].map(s => (
                <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(135deg,#5B7CFA,#7C5BFA)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>{s.n}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#6E7A8A" }}>{s.t}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
