"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { EquipeNav } from "@/app/equipe/clients/page";
import { haptic } from "@/lib/haptics";
import OfflineBanner from "@/components/OfflineBanner";

interface EquipeSession {
  token: string;
  prenom: string;
  marchandId: string;
  marchandNom: string;
  logo_url?: string | null;
  permissions: { notifs: boolean; clients: boolean };
}

interface TamponResult {
  type: "ok" | "recompense" | "choix_requis" | "anti_doublon" | "anti_doublon_limite" | "not_found";
  prenom?: string;
  tampons?: number;
  objectif?: number;
  nom_recompense?: string;
  prochain_recompense?: string;
  secondes_restantes?: number;
  clientId?: string;
  walletId?: string;
  double?: boolean;
  birthday?: boolean;
  birthday_offre?: string;
  palier_index?: number;
  mode_recompense?: string;
  paliers_valides?: boolean[];
  total_paliers?: number;
  palier_intermediaire?: number;
  nom_recompense_petit?: string;
  nom_recompense_grand?: string;
}

const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

function formatTemps(sec: number): string {
  if (sec < 3600) return `${Math.ceil(sec / 60)} min`;
  return `${Math.ceil(sec / 3600)} h`;
}

function avatarColor(initials: string) {
  const PALETTES = [
    { bg: "rgba(94,140,247,0.18)", text: "#5E8CF7" },
    { bg: "rgba(139,127,212,0.18)", text: "#9B8FE8" },
    { bg: "rgba(52,199,137,0.18)", text: "#34C789" },
    { bg: "rgba(247,133,110,0.18)", text: "#E8785E" },
  ];
  const code = (initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0);
  return PALETTES[code % PALETTES.length];
}

export default function EquipeScannerPage() {
  const router = useRouter();
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [session, setSession] = useState<EquipeSession | null>(null);
  const sessionRef = useRef<EquipeSession | null>(null);
  const [result, setResult] = useState<TamponResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permDenied, setPermDenied] = useState(false);
  const [invalidQr, setInvalidQr] = useState(false);
  const [validating, setValidating] = useState(false);
  const [enregistrantChoix, setEnregistrantChoix] = useState(false);
  const [clientsBadge, setClientsBadge] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  // Flex 2-step
  const [flexPending, setFlexPending] = useState<"petit" | "grand" | null>(null);
  const flexTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Member menu
  const [showMemberSheet, setShowMemberSheet] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    setIsNativeApp(cap?.isNativePlatform?.() === true);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("equipe_session");
    if (!raw) { router.replace("/equipe/auth"); return; }
    try {
      const s = JSON.parse(raw) as EquipeSession;
      setSession(s);
      sessionRef.current = s;
      const stored = parseInt(localStorage.getItem("equipe_pending") || "0", 10);
      if (!isNaN(stored)) setClientsBadge(stored);
    } catch { router.replace("/equipe/auth"); }
  }, [router]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
    setTorchOn(false);
  }, []);

  const scan = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scan);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);
    if (code?.data) {
      const walletId =
        code.data.match(/^WALLIO:([a-f0-9-]+)/)?.[1] ??
        code.data.match(/\/client\/([a-f0-9-]+)/)?.[1];
      stopCamera();
      if (walletId) handleTampon(walletId);
      else {
        setInvalidQr(true);
        setTimeout(() => { setInvalidQr(false); startCamera(); }, 2000);
      }
    } else {
      animRef.current = requestAnimationFrame(scan);
    }
  }, [stopCamera]); // eslint-disable-line

  const startCamera = useCallback(async () => {
    if (streamRef.current) return;
    setResult(null);
    setInvalidQr(false);
    if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      setPermDenied(false);
      animRef.current = requestAnimationFrame(scan);
    } catch {
      setPermDenied(true);
    }
  }, [scan]);

  // Auto-start quand session chargée
  useEffect(() => {
    if (!session) return;
    const t = setTimeout(() => startCamera(), 150);
    return () => clearTimeout(t);
  }, [session, startCamera]);

  // Auto-close result
  useEffect(() => {
    if (!result) return;
    if (result.type === "ok" || result.type === "not_found" || result.type === "anti_doublon") {
      const delay = result.type === "anti_doublon" ? 3000 : 2000;
      autoCloseRef.current = setTimeout(() => {
        setResult(null);
        startCamera();
      }, delay);
      return () => { if (autoCloseRef.current) clearTimeout(autoCloseRef.current); };
    }
  }, [result?.type, startCamera]); // eslint-disable-line

  async function handleTampon(walletId: string) {
    const s = sessionRef.current;
    if (!s) return;
    setLoading(true);
    try {
      const res = await fetch("/api/equipe/tampon", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-equipe-token": s.token },
        body: JSON.stringify({ walletId }),
      });
      const data = await res.json();
      setResult(data);
      if (data.type === "ok") haptic("medium");
      if (data.type === "recompense") haptic("success");
      if (data.type === "anti_doublon") haptic("warning");
    } catch {
      setResult({ type: "not_found" });
    } finally {
      setLoading(false);
    }
  }

  async function handleEnregistrerChoix(choix: "petit" | "grand") {
    const s = sessionRef.current;
    if (!s || !result?.clientId) return;
    setEnregistrantChoix(true);
    try {
      const res = await fetch("/api/equipe/enregistrer-choix", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-equipe-token": s.token },
        body: JSON.stringify({ clientId: result.clientId, choix }),
      });
      const data = await res.json();
      if (data.already_done) { setResult(null); startCamera(); return; }
      if (choix === "petit") {
        haptic("success");
        setResult(prev => prev ? { ...prev, type: "recompense", nom_recompense: prev.nom_recompense_petit } : prev);
      } else {
        setResult(prev => prev ? { ...prev, type: "ok" } : prev);
      }
    } catch { /* silent */ }
    finally { setEnregistrantChoix(false); setFlexPending(null); }
  }

  function handleFlexChoix(choix: "petit" | "grand") {
    if (flexPending === choix) {
      if (flexTimeoutRef.current) clearTimeout(flexTimeoutRef.current);
      setFlexPending(null);
      handleEnregistrerChoix(choix);
    } else {
      setFlexPending(choix);
      if (flexTimeoutRef.current) clearTimeout(flexTimeoutRef.current);
      flexTimeoutRef.current = setTimeout(() => setFlexPending(null), 3000);
    }
  }

  async function handleValiderRecompense() {
    const s = sessionRef.current;
    if (!s || !result?.clientId) return;
    setValidating(true);
    try {
      const isProgressif = result.mode_recompense === "progressif" && result.palier_index !== undefined;
      const valRes = await fetch("/api/equipe/valider-recompense", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-equipe-token": s.token },
        body: JSON.stringify({
          clientId: result.clientId,
          mode: result.mode_recompense || "cyclique",
          palierIndex: isProgressif ? result.palier_index : undefined,
          paliersValides: isProgressif ? (result.paliers_valides || []) : undefined,
          totalPaliers: isProgressif ? result.total_paliers : undefined,
        }),
      });
      const valData = await valRes.json().catch(() => ({}));
      haptic("success");
      if (isProgressif && result.total_paliers) {
        const pv = [...(result.paliers_valides || [])];
        pv[result.palier_index!] = true;
        const cycleTermine = pv.filter(Boolean).length >= result.total_paliers;
        setResult(prev => prev ? { ...prev, type: "ok", tampons: cycleTermine ? 0 : (prev.tampons ?? 0), nom_recompense: undefined } : prev);
      } else {
        const nvt = typeof valData.nouveauxTampons === "number" ? valData.nouveauxTampons : 0;
        setResult(prev => prev ? { ...prev, type: "ok", tampons: nvt, nom_recompense: undefined } : prev);
      }
    } catch { /* silent */ }
    finally { setValidating(false); }
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const on = !torchOn;
      await (track as MediaStreamTrack & { applyConstraints: (c: object) => Promise<void> })
        .applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
      setTorchOn(on);
    } catch { /* torch not supported */ }
  }

  async function handleLogout() {
    if (session) fetch("/api/equipe/session", { method: "DELETE", headers: { "x-equipe-token": session.token } }).catch(() => {});
    localStorage.removeItem("equipe_session");
    router.replace("/equipe/auth");
  }

  async function handleChanger() {
    if (session) {
      try {
        const res = await fetch("/api/equipe/session-info", { headers: { "x-equipe-token": session.token } });
        if (res.ok) { const d = await res.json(); localStorage.setItem("equipe_etablissement", JSON.stringify(d)); }
      } catch { /* silent */ }
      fetch("/api/equipe/session", { method: "DELETE", headers: { "x-equipe-token": session.token } }).catch(() => {});
    }
    localStorage.removeItem("equipe_session");
    router.replace("/equipe/auth?changer=1");
  }

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  if (!session) return null;

  const initiales = session.prenom[0]?.toUpperCase() || "?";
  const aColor = avatarColor(initiales);
  const hour = new Date().getHours();
  const greeting = hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour";

  return (
    <main style={{ height: "100svh", display: "flex", flexDirection: "column", background: "#000", position: "relative", overflow: "hidden" }}>
      <OfflineBanner />

      {/* Caméra plein écran */}
      <video
        ref={videoRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: scanning ? "block" : "none" }}
        playsInline muted
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Viewfinder overlay */}
      {scanning && !loading && !result && (
        <div style={{ position: "absolute", inset: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          {/* Cadre de visée */}
          <div style={{ position: "relative", width: 220, height: 220, animation: invalidQr ? "shake 0.4s ease-in-out" : "viewfinder-breathe 2.5s ease-in-out infinite" }}>
            {/* Ombre autour du cadre */}
            <div style={{ position: "absolute", inset: 0, boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)", borderRadius: 24, zIndex: -1 }} />
            {/* 4 coins */}
            {[
              { top: 0, left: 0, borderTop: "3px solid white", borderLeft: "3px solid white", borderTopLeftRadius: 10 },
              { top: 0, right: 0, borderTop: "3px solid white", borderRight: "3px solid white", borderTopRightRadius: 10 },
              { bottom: 0, left: 0, borderBottom: "3px solid white", borderLeft: "3px solid white", borderBottomLeftRadius: 10 },
              { bottom: 0, right: 0, borderBottom: "3px solid white", borderRight: "3px solid white", borderBottomRightRadius: 10 },
            ].map((style, i) => (
              <div key={i} style={{ position: "absolute", width: 24, height: 24, ...style } as React.CSSProperties} />
            ))}
            {invalidQr && (
              <div style={{ position: "absolute", inset: 0, border: "2px solid #FF3B30", borderRadius: 24 }} />
            )}
          </div>
          {/* Texte guide */}
          {!invalidQr && (
            <p style={{ position: "absolute", bottom: "calc(var(--tab-h, 49px) + env(safe-area-inset-bottom, 0px) + 100px)", color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: 500, textAlign: "center" }}>
              Pointez vers le QR code
            </p>
          )}
          {invalidQr && (
            <div style={{ position: "absolute", bottom: "calc(var(--tab-h, 49px) + env(safe-area-inset-bottom, 0px) + 80px)", background: "rgba(255,59,48,0.9)", backdropFilter: "blur(10px)", padding: "10px 20px", borderRadius: 100 }}>
              <p style={{ color: "white", fontSize: 13, fontWeight: 600 }}>Ce QR n&apos;est pas une carte Wallio</p>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* État permission refusée / idle */}
      {!scanning && !loading && !result && (
        <div style={{ position: "absolute", inset: 0, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", paddingTop: "calc(env(safe-area-inset-top) + 80px)", paddingBottom: "calc(var(--tab-h, 49px) + env(safe-area-inset-bottom, 0px) + 20px)", background: "#0A0A0A", gap: 20 }}>
          {permDenied ? (
            <>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/><line x1="2" y1="2" x2="22" y2="22" stroke="rgba(255,59,48,0.8)"/>
              </svg>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 8 }}>Caméra non autorisée</p>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Autorisez la caméra dans les réglages de votre appareil</p>
              </div>
              <button onClick={() => window.open("app-settings:", "_blank")}
                style={{ padding: "14px 28px", borderRadius: 16, background: "linear-gradient(135deg,#2F7BFF,#8B5CF6)", color: "white", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                Ouvrir les réglages
              </button>
            </>
          ) : (
            <>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg,#2F7BFF,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 48px rgba(47,123,255,0.4)" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3m0 4h4v-4m-4 0h-3v4"/>
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: "white", marginBottom: 6 }}>Prêt à scanner</p>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Demandez au client d&apos;afficher son QR code</p>
              </div>
              <button onClick={startCamera}
                style={{ width: "100%", maxWidth: 300, padding: "17px 0", borderRadius: 20, background: "linear-gradient(135deg,#2F7BFF,#8B5CF6)", color: "white", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 28px rgba(47,123,255,0.4)" }}>
                Ouvrir le scanner
              </button>
            </>
          )}
        </div>
      )}

      {/* Torche + Saisie manuelle */}
      {scanning && !result && (
        <div style={{ position: "absolute", left: 0, right: 0, zIndex: 3, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px", bottom: "calc(var(--tab-h, 49px) + env(safe-area-inset-bottom, 0px) + 24px)" }}>
          <button onClick={toggleTorch}
            style={{ width: 44, height: 44, borderRadius: "50%", background: torchOn ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={torchOn ? "#1D1D1F" : "white"} strokeWidth="2" strokeLinecap="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </button>
          <a href="/equipe/clients"
            style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", textDecoration: "none" }}>
            Saisir manuellement
          </a>
        </div>
      )}

      {/* Header semi-transparent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, paddingTop: "env(safe-area-inset-top, 0px)", background: scanning ? "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)" : "transparent" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "14px 20px 10px", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            {session.logo_url && (
              <img src={session.logo_url} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
            )}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, color: scanning ? "rgba(255,255,255,0.6)" : "var(--fg-tertiary)", letterSpacing: "0.03em" }}>{session.marchandNom}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: scanning ? "white" : "var(--fg)", letterSpacing: -0.3 }}>{greeting}, {cap(session.prenom)}</p>
            </div>
          </div>
          <button onClick={() => setShowMemberSheet(true)}
            style={{ width: 34, height: 34, borderRadius: "50%", background: aColor.bg, color: aColor.text, border: scanning ? "1.5px solid rgba(255,255,255,0.3)" : "none", cursor: "pointer", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
            {initiales}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ position: isNativeApp ? "absolute" : "fixed", bottom: 0, left: 0, right: 0, zIndex: 10 }}>
        <EquipeNav active="scanner" session={session} clientsBadge={clientsBadge} />
      </div>

      {/* Panneau résultat du bas */}
      {!loading && result && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20, background: "var(--bg)", borderRadius: "24px 24px 0 0", paddingBottom: "max(24px, calc(var(--tab-h, 49px) + env(safe-area-inset-bottom, 0px) + 16px))", animation: "slide-up 0.35s cubic-bezier(0.34,1.06,0.64,1)", boxShadow: "0 -4px 40px rgba(0,0,0,0.25)" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--border)", margin: "12px auto 20px" }} />
          <div style={{ padding: "0 20px 4px" }}>

            {result.type === "ok" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: 20, background: "linear-gradient(135deg,#2F7BFF,#8B5CF6)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(47,123,255,0.35)" }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "white" }}>+{result.double ? "2" : "1"}</span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", letterSpacing: -0.4, marginBottom: 4 }}>
                  {result.birthday ? "Joyeux anniversaire !" : result.double ? "2 tampons !" : "Tampon ajouté"}
                </p>
                <p style={{ fontSize: 15, color: "var(--fg-tertiary)", marginBottom: 16 }}>Bonjour {result.prenom}</p>
                <div style={{ height: 6, borderRadius: 99, background: "var(--border)", overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#2F7BFF,#8B5CF6)", width: `${Math.min(100, ((result.tampons ?? 0) / (result.objectif ?? 1)) * 100)}%`, transition: "width 0.6s ease" }} />
                </div>
                <p style={{ fontSize: 13, color: "var(--fg-tertiary)" }}>{result.tampons} / {result.objectif ?? "?"} tampons</p>
              </div>
            )}

            {result.type === "recompense" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: 20, background: "linear-gradient(135deg,#34C759,#30D158)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(52,199,89,0.35)" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)", letterSpacing: -0.4, marginBottom: 4 }}>Récompense !</p>
                <p style={{ fontSize: 15, color: "var(--fg-tertiary)", marginBottom: 6 }}>{result.prenom}</p>
                <p style={{ fontSize: 17, fontWeight: 700, color: "#34C759", marginBottom: 20 }}>Récompense à remettre : {cap(result.nom_recompense || "")}</p>
                <button onClick={handleValiderRecompense} disabled={validating}
                  style={{ width: "100%", padding: "16px", borderRadius: 18, background: "#34C759", color: "white", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", opacity: validating ? 0.7 : 1 }}>
                  {validating ? "Validation…" : "Valider la récompense"}
                </button>
              </div>
            )}

            {result.type === "choix_requis" && (
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", letterSpacing: -0.4, marginBottom: 4 }}>{result.prenom} a {result.tampons} tampons</p>
                <p style={{ fontSize: 15, color: "var(--fg-tertiary)", marginBottom: 20 }}>Que choisit-il ?</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={() => handleFlexChoix("petit")} disabled={enregistrantChoix}
                    style={{ padding: "16px", borderRadius: 18, background: flexPending === "petit" ? "#FF9F0A" : "linear-gradient(135deg,#2F7BFF,#8B5CF6)", color: "white", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}>
                    {flexPending === "petit"
                      ? `Confirmer : ${cap(result.nom_recompense_petit || "Petite")}`
                      : cap(result.nom_recompense_petit || "Petite récompense")}
                  </button>
                  <button onClick={() => handleFlexChoix("grand")} disabled={enregistrantChoix}
                    style={{ padding: "14px", borderRadius: 18, background: flexPending === "grand" ? "#FF9F0A" : "var(--glass-bg)", color: flexPending === "grand" ? "white" : "var(--fg)", border: "1px solid var(--border)", fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                    {flexPending === "grand"
                      ? `Confirmer : Continuer`
                      : `Continuer vers ${cap(result.nom_recompense_grand || "Grande")}`}
                  </button>
                </div>
              </div>
            )}

            {result.type === "anti_doublon" && (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(255,159,10,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF9F0A" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)", marginBottom: 4 }}>Tampon déjà ajouté</p>
                  <p style={{ fontSize: 14, color: "var(--fg-tertiary)" }}>
                    {result.prenom && `${result.prenom} · `}
                    {(result.secondes_restantes ?? 0) > 0 ? `Prochain dans ${formatTemps(result.secondes_restantes ?? 0)}` : ""}
                  </p>
                </div>
              </div>
            )}

            {result.type === "not_found" && (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: "var(--fg)", marginBottom: 6 }}>QR invalide</p>
                <p style={{ fontSize: 14, color: "var(--fg-tertiary)" }}>Ce QR code n&apos;est pas une carte Wallio</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member sheet */}
      {showMemberSheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => { setShowMemberSheet(false); setShowQuitConfirm(false); }}>
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--bg)", borderRadius: "24px 24px 0 0", paddingBottom: "max(16px, env(safe-area-inset-bottom))", animation: "slide-up 0.3s cubic-bezier(0.34,1.06,0.64,1)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--border)", margin: "12px auto 16px" }} />
            <div style={{ padding: "0 16px 8px" }}>
              <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
                <button onClick={handleChanger}
                  style={{ width: "100%", padding: "16px 20px", background: "var(--glass-bg)", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", textAlign: "left", fontSize: 15, color: "var(--fg)" }}>
                  Changer de membre
                </button>
                {!showQuitConfirm ? (
                  <button onClick={() => setShowQuitConfirm(true)}
                    style={{ width: "100%", padding: "16px 20px", background: "var(--glass-bg)", border: "none", cursor: "pointer", textAlign: "left", fontSize: 15, color: "#FF3B30" }}>
                    Quitter
                  </button>
                ) : (
                  <div style={{ padding: "14px 20px", background: "rgba(255,59,48,0.06)" }}>
                    <p style={{ fontSize: 13, color: "var(--fg-secondary)", marginBottom: 10 }}>Quitter la session de {cap(session.prenom)} ?</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setShowQuitConfirm(false)} style={{ flex: 1, padding: "10px", borderRadius: 12, background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)", fontSize: 14, cursor: "pointer" }}>Annuler</button>
                      <button onClick={handleLogout} style={{ flex: 1, padding: "10px", borderRadius: 12, background: "#FF3B30", color: "white", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Quitter</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
