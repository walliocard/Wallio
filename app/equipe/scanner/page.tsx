"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { EquipeNav } from "@/app/equipe/clients/page";

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
  double?: boolean;
  birthday?: boolean;
  palier_index?: number;
  mode_recompense?: string;
  paliers_valides?: boolean[];
  total_paliers?: number;
}

function formatTemps(sec: number): string {
  if (sec < 3600) return `${Math.ceil(sec / 60)} min`;
  return `${Math.ceil(sec / 3600)} h`;
}

export default function EquipeScannerPage() {
  const router = useRouter();
  const [session, setSession] = useState<EquipeSession | null>(null);
  const sessionRef = useRef<EquipeSession | null>(null);
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
    try {
      const s = JSON.parse(raw) as EquipeSession;
      setSession(s);
      sessionRef.current = s;
    } catch { router.replace("/auth/connexion"); }
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
    const code = jsQR(imageData.data, canvas.width, canvas.height);
    if (code?.data) {
      const walletId =
        code.data.match(/^WALLIO:([a-f0-9-]+)/)?.[1] ??
        code.data.match(/\/client\/([a-f0-9-]+)/)?.[1];
      stopCamera();
      if (walletId) handleTampon(walletId);
      else setResult({ type: "not_found" });
    } else {
      animRef.current = requestAnimationFrame(scan);
    }
  }, [stopCamera]); // eslint-disable-line

  async function startCamera() {
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      setScanning(true);
      // Le video est dans le DOM — on attend le prochain frame pour assigner
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            animRef.current = requestAnimationFrame(scan);
          }).catch(() => {});
        }
      });
    } catch {
      setResult({ type: "not_found" });
    }
  }

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
    } catch {
      setResult({ type: "not_found" });
    } finally {
      setLoading(false);
    }
  }

  async function handleValiderRecompense() {
    const s = sessionRef.current;
    if (!s || !result?.clientId) return;
    setValidating(true);
    try {
      const isProgressif = result.mode_recompense === "progressif" && result.palier_index !== undefined;
      await fetch("/api/equipe/valider-recompense", {
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
      if (isProgressif && result.total_paliers) {
        const pv = [...(result.paliers_valides || [])];
        pv[result.palier_index!] = true;
        const cycleTermine = pv.filter(Boolean).length >= result.total_paliers;
        setResult(prev => prev ? { ...prev, type: "ok", tampons: cycleTermine ? 0 : (prev.tampons ?? 0), nom_recompense: undefined } : prev);
      } else {
        setResult(prev => prev ? { ...prev, type: "ok", tampons: 0, nom_recompense: undefined } : prev);
      }
    } catch { /* silent */ }
    finally { setValidating(false); }
  }

  async function handleLogout() {
    if (session) fetch("/api/equipe/session", { method: "DELETE", headers: { "x-equipe-token": session.token } }).catch(() => {});
    localStorage.removeItem("equipe_session");
    router.replace("/auth/connexion");
  }

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  if (!session) return null;

  return (
    <main style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "#F0F4FF",
      paddingTop: "env(safe-area-inset-top)",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px" }}>
        <div>
          <p style={{ fontSize: 12, color: "#6E6E73", marginBottom: 1 }}>{session.marchandNom}</p>
          <p style={{ fontSize: 19, fontWeight: 700, color: "#1D1D1F", letterSpacing: -0.3 }}>Bonjour, {session.prenom}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={async () => {
            if (session) {
              fetch("/api/equipe/session", { method: "DELETE", headers: { "x-equipe-token": session.token } }).catch(() => {});
            }
            localStorage.removeItem("equipe_session");
            router.replace("/auth/connexion?changer=1");
          }}
            style={{ padding: "8px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: "rgba(0,0,0,0.06)", color: "#6E6E73", border: "none", cursor: "pointer" }}>
            Changer
          </button>
          <button onClick={handleLogout}
            style={{ padding: "8px 14px", borderRadius: 12, fontSize: 13, fontWeight: 600, background: "rgba(255,59,48,0.1)", color: "#FF3B30", border: "none", cursor: "pointer" }}>
            Quitter
          </button>
        </div>
      </div>

      {/* Zone principale */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 16px 16px", gap: 12 }}>

        {/* ── Caméra — toujours dans le DOM pour que videoRef soit disponible ── */}
        <div style={{ flex: 1, display: scanning ? "flex" : "none", flexDirection: "column", gap: 12 }}>
          <div style={{ flex: 1, position: "relative", borderRadius: 24, overflow: "hidden", background: "#000", minHeight: 340 }}>
            <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} playsInline muted />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: 220, height: 220, borderRadius: 20, border: "2.5px solid white", boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />
            </div>
            <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>Pointez vers le QR code du client</p>
            </div>
          </div>
          <button onClick={stopCamera} style={{
            padding: "16px 0", borderRadius: 18, fontSize: 16, fontWeight: 600,
            background: "rgba(255,255,255,0.9)", color: "#6E6E73", border: "none", cursor: "pointer",
          }}>
            Annuler
          </button>
        </div>

        {/* ── Idle ── */}
        {!scanning && !loading && !result && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <div style={{
              width: 96, height: 96, borderRadius: 28,
              background: "linear-gradient(135deg,#007AFF,#8B5CF6)",
              boxShadow: "0 16px 48px rgba(91,124,250,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3m0 4h4v-4m-4 0h-3v4"/>
              </svg>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", letterSpacing: -0.3, marginBottom: 6 }}>Prêt à scanner</p>
              <p style={{ fontSize: 14, color: "#6E6E73" }}>Demandez au client d&apos;afficher son QR code</p>
            </div>
            <button onClick={startCamera} style={{
              width: "100%", maxWidth: 320, padding: "18px 0",
              borderRadius: 20, fontSize: 17, fontWeight: 700, color: "white", border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#007AFF,#8B5CF6)",
              boxShadow: "0 8px 28px rgba(91,124,250,0.4)",
            }}>
              Ouvrir le scanner
            </button>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid rgba(0,122,255,0.2)", borderTopColor: "#007AFF", animation: "spin 0.7s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* ── Résultat ── */}
        {!loading && result && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{
              flex: 1, borderRadius: 28, padding: "32px 24px", textAlign: "center",
              background: "white", border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
            }}>

              {result.type === "ok" && (
                <>
                  <div style={{ width: 72, height: 72, borderRadius: 22, background: "linear-gradient(135deg,#007AFF,#8B5CF6)", boxShadow: "0 10px 30px rgba(91,124,250,0.35)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: "white" }}>+{(result.double || result.birthday) ? "2" : "1"}</span>
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 700, color: "#1D1D1F", letterSpacing: -0.4 }}>
                    {result.birthday ? "Joyeux anniversaire !" : result.double ? "2 tampons ajoutés" : "Tampon ajouté"}
                  </p>
                  <p style={{ fontSize: 16, color: "#6E6E73" }}>Bonjour {result.prenom}</p>
                  {result.birthday && (
                    <p style={{ fontSize: 13, color: "#FF2D55", fontWeight: 600, marginTop: 4 }}>Bonus anniversaire — 2 tampons offerts</p>
                  )}
                  <div style={{ width: "100%", marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#AEAEB2", marginBottom: 8 }}>
                      <span>{result.tampons} tampon{(result.tampons ?? 0) > 1 ? "s" : ""}</span>
                      <span>Objectif {result.objectif}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: "#E5E5EA", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#007AFF,#8B5CF6)", width: `${Math.min(((result.tampons ?? 0) / (result.objectif ?? 1)) * 100, 100)}%`, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                </>
              )}

              {result.type === "recompense" && (
                <>
                  <div style={{ width: 72, height: 72, borderRadius: 22, background: "linear-gradient(135deg,#34C759,#30D158)", boxShadow: "0 10px 30px rgba(52,199,89,0.35)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 700, color: "#1D1D1F", letterSpacing: -0.4 }}>Récompense !</p>
                  <p style={{ fontSize: 16, color: "#6E6E73" }}>Bonjour {result.prenom}</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#34C759", marginTop: 4 }}>{result.nom_recompense}</p>
                  <button onClick={handleValiderRecompense} disabled={validating} style={{
                    marginTop: 20, width: "100%", padding: "18px 0",
                    borderRadius: 18, fontSize: 16, fontWeight: 700, color: "white", border: "none", cursor: "pointer",
                    background: "#34C759", opacity: validating ? 0.7 : 1,
                  }}>
                    {validating ? "Validation…" : "Valider la récompense"}
                  </button>
                </>
              )}

              {result.type === "anti_doublon" && (
                <>
                  <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(255,159,10,0.12)", border: "1.5px solid rgba(255,159,10,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: "#FF9F0A" }}>!</span>
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 700, color: "#1D1D1F", letterSpacing: -0.4 }}>Déjà enregistré</p>
                  <p style={{ fontSize: 16, color: "#6E6E73" }}>Bonjour {result.prenom}</p>
                  {(result.secondes_restantes ?? 0) > 0 && (
                    <div style={{ marginTop: 12, padding: "10px 20px", borderRadius: 14, background: "rgba(255,159,10,0.10)", border: "1px solid rgba(255,159,10,0.22)" }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#FF9F0A" }}>Prochain tampon dans {formatTemps(result.secondes_restantes ?? 0)}</p>
                    </div>
                  )}
                </>
              )}

              {result.type === "not_found" && (
                <>
                  <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(255,59,48,0.10)", border: "1.5px solid rgba(255,59,48,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: "#FF3B30" }}>!</span>
                  </div>
                  <p style={{ fontSize: 26, fontWeight: 700, color: "#1D1D1F", letterSpacing: -0.4 }}>QR non reconnu</p>
                  <p style={{ fontSize: 16, color: "#6E6E73" }}>Vérifiez que le client affiche bien son QR Wallio</p>
                </>
              )}
            </div>

            <button onClick={startCamera} style={{
              padding: "18px 0", borderRadius: 20, fontSize: 16, fontWeight: 700, color: "white", border: "none", cursor: "pointer",
              background: "linear-gradient(135deg,#007AFF,#8B5CF6)",
              boxShadow: "0 8px 24px rgba(91,124,250,0.35)",
            }}>
              Scanner un autre client
            </button>
          </div>
        )}
      </div>

      <EquipeNav active="scanner" session={session} />
    </main>
  );
}
