"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";

interface EquipeSession {
  token: string;
  prenom: string;
  marchandId: string;
  marchandNom: string;
  permissions: { notifs: boolean; clients: boolean };
}

interface TamponResult {
  type: "ok" | "recompense" | "anti_doublon" | "not_found";
  prenom?: string;
  tampons?: number;
  objectif?: number;
  nom_recompense?: string;
  secondes_restantes?: number;
  clientId?: string;
  palier_index?: number;
  double?: boolean;
}

function formatTemps(sec: number): string {
  if (sec < 3600) return `${Math.ceil(sec / 60)} min`;
  return `${Math.ceil(sec / 3600)} h`;
}

export default function EquipeScannerPage() {
  const router = useRouter();
  const [session, setSession] = useState<EquipeSession | null>(null);
  const [result, setResult] = useState<TamponResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("equipe_session");
    if (!raw) { router.replace("/auth/connexion"); return; }
    try { setSession(JSON.parse(raw)); } catch { router.replace("/auth/connexion"); }
  }, [router]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
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
    const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" });
    if (code?.data) {
      stopCamera();
      const match = code.data.match(/\/client\/([a-f0-9-]{36})/);
      if (match) handleTampon(match[1]);
    } else {
      animRef.current = requestAnimationFrame(scan);
    }
  }, [stopCamera]); // eslint-disable-line

  async function startCamera() {
    setResult(null);
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      animRef.current = requestAnimationFrame(scan);
    } catch {
      setScanning(false);
    }
  }

  async function handleTampon(walletId: string) {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch("/api/equipe/tampon", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-equipe-token": session.token },
        body: JSON.stringify({ walletId }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ type: "not_found" });
    } finally {
      setLoading(false);
    }
  }

  async function handleValiderRecompense() {
    if (!session || !result?.clientId) return;
    setValidating(true);
    try {
      await fetch("/api/equipe/valider-recompense", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-equipe-token": session.token },
        body: JSON.stringify({ clientId: result.clientId }),
      });
      setResult(prev => prev ? { ...prev, type: "ok", tampons: 0 } : prev);
    } catch { /* silent */ }
    finally { setValidating(false); }
  }

  async function handleLogout() {
    if (session) {
      fetch("/api/equipe/session", { method: "DELETE", headers: { "x-equipe-token": session.token } }).catch(() => {});
    }
    localStorage.removeItem("equipe_session");
    router.replace("/auth/connexion");
  }

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  if (!session) return null;

  const ACCENT = "#007AFF";
  const BG = "#F5F5F7";

  return (
    <main className="min-h-screen flex flex-col" style={{ background: BG }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <div>
          <p className="text-[13px]" style={{ color: "#6E6E73" }}>{session.marchandNom}</p>
          <p className="text-[20px] font-semibold" style={{ color: "#1D1D1F" }}>Bonjour, {session.prenom}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setSession(null); setTimeout(() => { const raw = localStorage.getItem("equipe_session"); if (raw) { try { const s = JSON.parse(raw); s.prenom = ""; localStorage.setItem("equipe_session", JSON.stringify(s)); } catch {} } router.replace("/auth/connexion"); }, 0); }}
            className="px-3 py-2 rounded-xl text-[12px] font-medium" style={{ background: "rgba(0,0,0,0.06)", color: "#6E6E73" }}>
            Changer
          </button>
          <button onClick={handleLogout}
            className="px-3 py-2 rounded-xl text-[12px] font-medium" style={{ background: "rgba(255,59,48,0.1)", color: "#FF3B30" }}>
            Quitter
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col px-5 pb-8 gap-4">

        {/* Zone scanner / résultat */}
        {!scanning && !loading && !result && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#007AFF,#8B5CF6)", boxShadow: "0 12px 40px rgba(91,124,250,0.35)" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3m0 4h4v-4m-4 0h-3v4"/>
              </svg>
            </div>
            <p className="text-[17px] font-semibold text-center" style={{ color: "#1D1D1F" }}>Scanner le QR code du client</p>
            <button onClick={startCamera}
              className="w-full max-w-[280px] py-4 rounded-2xl text-[16px] font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#007AFF,#8B5CF6)", boxShadow: "0 8px 24px rgba(91,124,250,0.35)" }}>
              Ouvrir le scanner
            </button>
          </div>
        )}

        {/* Caméra */}
        {scanning && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative rounded-3xl overflow-hidden" style={{ aspectRatio: "1", background: "#000" }}>
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-52 h-52 rounded-2xl" style={{ border: "2px solid rgba(255,255,255,0.7)", boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" }} />
              </div>
            </div>
            <button onClick={stopCamera}
              className="w-full py-3.5 rounded-2xl text-[15px] font-medium"
              style={{ background: "rgba(0,0,0,0.06)", color: "#6E6E73" }}>
              Annuler
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: ACCENT, borderTopColor: "transparent" }} />
          </div>
        )}

        {/* Résultat */}
        {!loading && result && (
          <div className="flex-1 flex flex-col">
            <div className="rounded-[28px] p-6 text-center" style={{ background: "white", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>

              {result.type === "ok" && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#007AFF,#8B5CF6)", boxShadow: "0 8px 24px rgba(91,124,250,0.3)" }}>
                    <span className="text-[22px] font-bold text-white">+{result.double ? "2" : "1"}</span>
                  </div>
                  <p className="text-[22px] font-semibold mb-1" style={{ color: "#1D1D1F" }}>Tampon ajouté</p>
                  <p className="text-[15px] mb-5" style={{ color: "#6E6E73" }}>Bonjour {result.prenom}</p>
                  <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: "#E5E5EA" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(((result.tampons ?? 0) / (result.objectif ?? 1)) * 100, 100)}%`, background: "linear-gradient(90deg,#007AFF,#8B5CF6)" }} />
                  </div>
                  <p className="text-[13px]" style={{ color: "#AEAEB2" }}>{result.tampons} / {result.objectif} tampons</p>
                </>
              )}

              {result.type === "recompense" && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#34C759,#30D158)", boxShadow: "0 8px 24px rgba(52,199,89,0.3)" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p className="text-[22px] font-semibold mb-1" style={{ color: "#1D1D1F" }}>Récompense !</p>
                  <p className="text-[15px] mb-2" style={{ color: "#6E6E73" }}>Bonjour {result.prenom}</p>
                  <p className="text-[16px] font-semibold mb-5" style={{ color: "#34C759" }}>{result.nom_recompense}</p>
                  <button onClick={handleValiderRecompense} disabled={validating}
                    className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white"
                    style={{ background: "#34C759", opacity: validating ? 0.7 : 1 }}>
                    {validating ? "Validation…" : "Valider la récompense"}
                  </button>
                </>
              )}

              {result.type === "anti_doublon" && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(255,159,10,0.12)", border: "1.5px solid rgba(255,159,10,0.28)" }}>
                    <span className="text-[28px] font-bold" style={{ color: "#FF9F0A" }}>!</span>
                  </div>
                  <p className="text-[22px] font-semibold mb-1" style={{ color: "#1D1D1F" }}>Déjà enregistré</p>
                  <p className="text-[15px] mb-4" style={{ color: "#6E6E73" }}>Bonjour {result.prenom}</p>
                  {(result.secondes_restantes ?? 0) > 0 && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                      style={{ background: "rgba(255,159,10,0.10)", border: "1px solid rgba(255,159,10,0.22)" }}>
                      <span className="text-[13px] font-medium" style={{ color: "#FF9F0A" }}>Prochain tampon dans {formatTemps(result.secondes_restantes ?? 0)}</span>
                    </div>
                  )}
                </>
              )}

              {result.type === "not_found" && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(255,59,48,0.1)", border: "1.5px solid rgba(255,59,48,0.2)" }}>
                    <span className="text-[24px] font-bold" style={{ color: "#FF3B30" }}>!</span>
                  </div>
                  <p className="text-[22px] font-semibold mb-1" style={{ color: "#1D1D1F" }}>Client introuvable</p>
                  <p className="text-[15px]" style={{ color: "#6E6E73" }}>Ce QR code n&apos;est pas reconnu</p>
                </>
              )}
            </div>

            <button onClick={() => { setResult(null); startCamera(); }}
              className="mt-4 w-full py-4 rounded-2xl text-[15px] font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#007AFF,#8B5CF6)" }}>
              Scanner un autre client
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
