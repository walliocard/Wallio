"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Icons } from "@/components/dashboard/icons";
import { getClientByTelephone, formatTemps, setClientEmail, type Client } from "@/lib/loyalty";
import { collection, query, where, getDocs, getDoc, doc, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import jsQR from "jsqr";
import { useLang } from "@/lib/lang-context";
import { useToast } from "@/components/Toast";
import { triggerAmbientPulse } from "@/components/AmbientBackground";
import { SmokeCard } from "@/components/dashboard/SmokeCard";
import { formatName } from "@/lib/format";
import { formatTempsDepuis } from "@/lib/loyalty";

type Tab = "qr" | "telephone" | "nom";
interface TamponResult {
  type: "ok" | "recompense" | "choix_requis" | "anti_doublon" | "not_found";
  prenom?: string; tampons?: number; objectif?: number;
  nom_recompense?: string; prochain_recompense?: string;
  secondes_restantes?: number; clientId?: string; walletId?: string;
  recompense_en_attente?: boolean;
  double?: boolean; birthday?: boolean; birthday_offre?: string;
  palier_index?: number; mode_recompense?: string;
  paliers_valides?: boolean[]; total_paliers?: number;
  palier_intermediaire?: number; nom_recompense_petit?: string; nom_recompense_grand?: string;
}

export default function ScannerPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const showToast = useToast();
  const [tab, setTab] = useState<Tab>("qr");

  // QR
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [scanning, setScanning] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const nativeAutoRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isNative = typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
  const [torch, setTorch] = useState(false);
  type RecentScan = { prenom: string; nom: string; ts: string | null };
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [result, setResult] = useState<TamponResult | null>(null);
  const [loadingTampon, setLoadingTampon] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validatingAnniv, setValidatingAnniv] = useState(false);
  const [enregistrantChoix, setEnregistrantChoix] = useState(false);
  const [clientHasNoEmail, setClientHasNoEmail] = useState<boolean | null>(null);
  const [clientEmailInput, setClientEmailInput] = useState("");
  const [clientEmailSaving, setClientEmailSaving] = useState(false);
  const [clientEmailSaved, setClientEmailSaved] = useState(false);
  const [clientTelForEmail, setClientTelForEmail] = useState("");
  const [clientPrenomForEmail, setClientPrenomForEmail] = useState("");

  // Téléphone
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [phoneResult, setPhoneResult] = useState<Client | "not_found" | null>(null);

  // Nom
  const [nom, setNom] = useState("");
  const [searchingNom, setSearchingNom] = useState(false);
  const [nomResults, setNomResults] = useState<Client[] | null>(null);

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
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height);
    if (code?.data) {
      const walletId =
        code.data.match(/^WALLIO:([a-f0-9-]+)/)?.[1] ??
        code.data.match(/\/client\/([a-f0-9-]+)/)?.[1];
      if (walletId) {
        if (navigator.vibrate) navigator.vibrate(50);
        stopCamera();
        handleTampon(walletId);
        return;
      }
    }
    animRef.current = requestAnimationFrame(scan);
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraPermissionDenied(false);
      setScanning(true);
      animRef.current = requestAnimationFrame(scan);
    } catch {
      setScanning(false);
      setCameraPermissionDenied(true);
    }
  }

  function stopCamera() {
    cancelAnimationFrame(animRef.current);
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    setScanning(false);
    setTorch(false);
  }

  async function toggleTorch() {
    const video = videoRef.current;
    if (!video?.srcObject) return;
    const track = (video.srcObject as MediaStream).getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch } as MediaTrackConstraintSet] });
      setTorch(t => !t);
    } catch {}
  }

  useEffect(() => () => { cancelAnimationFrame(animRef.current); stopCamera(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Natif : démarrage auto de la caméra quand on arrive sur l'onglet QR
  useEffect(() => {
    if (!isNative || tab !== "qr" || scanning || nativeAutoRef.current) return;
    nativeAutoRef.current = true;
    startCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isNative]);

  // Derniers scans (3 derniers tampons valides du marchand)
  useEffect(() => {
    if (!user) return;
    getDocs(query(
      collection(db, "marchands", user.uid, "historique"),
      orderBy("created_at", "desc"),
      limit(10)
    )).then(snap => {
      const scans: RecentScan[] = snap.docs
        .filter(d => d.data().type !== "anti_doublon" && d.data().type !== "auto_validation")
        .slice(0, 3)
        .map(d => ({
          prenom: d.data().client_prenom || "",
          nom: d.data().client_nom || "",
          ts: d.data().created_at?.toDate?.()?.toISOString() || null,
        }));
      setRecentScans(scans);
    }).catch(() => {});
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleTampon(walletId: string, forceOverride = false) {
    if (!auth.currentUser) return;
    setLoadingTampon(true); setResult(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/dashboard/tampon", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ walletId, forceOverride }),
      });
      const data = await res.json();
      setResult(data);
      setClientHasNoEmail(null); setClientEmailInput(""); setClientEmailSaved(false);
      if (data.clientId && (data.type === "ok" || data.type === "recompense")) {
        getDoc(doc(db, "clients", data.clientId)).then(snap => {
          if (snap.exists()) {
            const d = snap.data();
            setClientHasNoEmail(!d.email);
            setClientTelForEmail(d.telephone || "");
            setClientPrenomForEmail(d.prenom || "");
          }
        }).catch(() => {});
      }
      if (data.type === "ok" || data.type === "recompense") triggerAmbientPulse();
      if (data.type === "recompense") showToast(`Récompense débloquée — ${data.nom_recompense}`, "success");
      if (data.type === "choix_requis") showToast(`Choix disponible — ${data.prenom}${data.birthday ? " · Joyeux anniversaire !" : ""}`, "info");
    } catch { setResult({ type: "not_found" }); }
    finally { setLoadingTampon(false); }
  }

  async function handleValiderRecompense() {
    if (!result?.clientId || !auth.currentUser) return;
    setValidating(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const valRes = await fetch("/api/valider-recompense", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ clientId: result.clientId }),
      });
      const valData = await valRes.json().catch(() => ({}));
      showToast("Récompense validée", "success");
      const nvt = typeof valData.nouveauxTampons === "number" ? valData.nouveauxTampons : 0;
      setResult(prev => prev ? { ...prev, type: "ok", tampons: nvt, nom_recompense: undefined } : prev);
    } catch { /**/ }
    finally { setValidating(false); }
  }

  async function handleEnregistrerChoix(choix: "petit" | "grand") {
    if (!result?.clientId || !auth.currentUser) return;
    setEnregistrantChoix(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/dashboard/enregistrer-choix", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ clientId: result.clientId, choix }),
      });
      const data = await res.json();
      if (data.already_done) {
        showToast("Choix déjà enregistré", "info");
        setResult(null);
        return;
      }
      if (choix === "petit") {
        showToast(`Récompense : ${result.nom_recompense_petit}`, "success");
        setResult(prev => prev ? { ...prev, type: "recompense", nom_recompense: prev.nom_recompense_petit } : prev);
      } else {
        showToast(`Continue vers : ${result.nom_recompense_grand}`, "info");
        setResult(prev => prev ? { ...prev, type: "ok", tampons: prev.tampons, objectif: prev.objectif } : prev);
      }
    } catch { showToast("Erreur lors de l'enregistrement", "error"); }
    finally { setEnregistrantChoix(false); }
  }

  async function handleValiderAnniv() {
    if (!result?.clientId || !auth.currentUser) return;
    setValidatingAnniv(true);
    try {
      const token = await auth.currentUser.getIdToken();
      await fetch("/api/valider-anniv", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ clientId: result.clientId }),
      });
      setResult(prev => prev ? { ...prev, birthday: false } : prev);
    } catch { /**/ }
    finally { setValidatingAnniv(false); }
  }

  async function rechercherParTelephone() {
    if (!user || !phone.trim()) return;
    setSearching(true);
    setPhoneResult(null);
    const client = await getClientByTelephone(phone.trim(), user.uid);
    setPhoneResult(client || "not_found");
    setSearching(false);
  }

  async function rechercherParNom() {
    if (!user || !nom.trim()) return;
    setSearchingNom(true);
    setNomResults(null);
    const q = query(collection(db, "clients"), where("marchand_id", "==", user.uid));
    const snap = await getDocs(q);
    const terme = nom.trim().toLowerCase();
    const resultats = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Client))
      .filter(c => `${c.prenom} ${c.nom}`.toLowerCase().includes(terme));
    setNomResults(resultats);
    setSearchingNom(false);
  }


  return (
    <div className="min-h-screen flex flex-col pb-36 md:pb-8">

      {/* Header */}
      <div className="px-5 md:px-8 lg:px-10 pt-8 lg:pt-10 mb-5">
        <h1 className="text-[34px] font-bold tracking-[-1px] mb-4" style={{ color: "var(--fg)" }}>{t.scan_title}</h1>

        {/* Sélecteur segmenté — pleine largeur */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.06)", borderRadius: 10, padding: 3 }}>
          {([["qr", t.scan_tab_qr], ["telephone", t.scan_tab_phone], ["nom", t.scan_tab_name]] as [Tab, string][]).map(([tab_, label]) => (
            <button
              key={tab_}
              onClick={() => {
                setTab(tab_);
                setPhoneResult(null); setPhone("");
                setNomResults(null); setNom("");
                if (scanning) stopCamera();
              }}
              style={{
                padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: tab === tab_ ? 600 : 400,
                background: tab === tab_ ? "#FFFFFF" : "transparent",
                color: tab === tab_ ? "var(--fg)" : "var(--fg-tertiary)",
                border: "none", cursor: "pointer",
                boxShadow: tab === tab_ ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 md:px-8 lg:px-10">

        {/* ── Tab QR ── */}
        {tab === "qr" && (
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:max-w-md">
              {/* Zone caméra — un seul <video>, plein écran en natif */}
              {scanning && (
                <div className="relative overflow-hidden"
                  style={isNative ? {
                    position: "fixed", inset: 0, zIndex: 100, borderRadius: 0,
                  } : {
                    borderRadius: 24, height: 300,
                  }}>
                  <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <canvas ref={canvasRef} style={{ display: "none" }} />

                  {/* Cadre de visée */}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{
                      width: isNative ? 220 : 192, height: isNative ? 220 : 192,
                      position: "relative",
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                    }}>
                      {["top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl","top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl","bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl","bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl"].map((cls, i) => (
                        <div key={i} className={`absolute w-8 h-8 ${cls}`}
                          style={{ borderColor: "white", animation: `qr-pulse 1.8s ease-in-out ${i*0.15}s infinite` }} />
                      ))}
                    </div>
                  </div>
                  <style>{`@keyframes qr-pulse{0%,100%{opacity:.7}50%{opacity:1}}`}</style>

                  {isNative ? (
                    <>
                      {/* Torche */}
                      <button onClick={toggleTorch} style={{
                        position: "absolute", top: "calc(env(safe-area-inset-top,20px) + 16px)", right: 20,
                        width: 44, height: 44, borderRadius: "50%",
                        background: torch ? "white" : "rgba(255,255,255,0.18)",
                        backdropFilter: "blur(10px)", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={torch ? "#1D1D1F" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 2h6l-1 7h-4L9 2z"/><path d="M10 9L6 20h12L14 9"/><line x1="12" y1="20" x2="12" y2="22"/>
                        </svg>
                      </button>
                      {/* Saisir manuellement */}
                      <button onClick={() => { stopCamera(); nativeAutoRef.current = false; }} style={{
                        position: "absolute", bottom: "calc(env(safe-area-inset-bottom,20px) + 24px)",
                        left: "50%", transform: "translateX(-50%)",
                        padding: "12px 24px", borderRadius: 100,
                        background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)",
                        color: "white", fontSize: 14, fontWeight: 600,
                        border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer", whiteSpace: "nowrap",
                      }}>
                        Saisir manuellement
                      </button>
                    </>
                  ) : (
                    <button onClick={stopCamera} className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full text-[13px] font-medium"
                      style={{ background: "rgba(0,0,0,0.55)", color: "white", backdropFilter: "blur(10px)" }}>
                      {t.scan_stop}
                    </button>
                  )}
                </div>
              )}

              {/* Loading tampon */}
              {loadingTampon && (
                <div className="rounded-3xl flex items-center justify-center h-[300px]" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                  <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
                </div>
              )}

              {/* Résultat */}
              {!loadingTampon && result && (
                <div className="rounded-3xl p-6 flex flex-col items-center text-center gap-3" style={{
                  background: result.type === "recompense"
                    ? "linear-gradient(135deg,rgba(0,122,255,0.04),rgba(139,92,246,0.04))"
                    : "var(--glass-bg)",
                  border: result.type === "recompense"
                    ? "1px solid rgba(139,92,246,0.22)"
                    : "1px solid var(--border)",
                  animation: (result.type === "anti_doublon" || result.type === "not_found")
                    ? "shake 0.4s ease-in-out"
                    : "slide-up 0.3s cubic-bezier(0.34,1.06,0.64,1)"
                }}>
                  {result.type === "ok" && (<>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1" style={{ background: "rgba(0,122,255,0.10)", animation: "success-pop 0.45s cubic-bezier(0.34,1.56,0.64,1)" }}>
                      <span className="text-[22px] font-black" style={{ color: "var(--accent)" }}>+{result.double || result.birthday ? 2 : 1}</span>
                    </div>
                    <p className="text-[18px] font-bold" style={{ color: "var(--fg)" }}>Bonjour, {result.prenom}</p>
                    {result.birthday && (
                      <div className="w-full">
                        <p className="text-[13px] font-semibold text-center" style={{ color: "#FF2D55" }}>Bon anniversaire !</p>
                        {result.birthday_offre && (
                          <div className="flex items-center justify-between mt-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,45,85,0.08)" }}>
                            <p className="text-[13px] font-semibold" style={{ color: "#FF2D55" }}>{result.birthday_offre}</p>
                            <button onClick={handleValiderAnniv} disabled={validatingAnniv}
                              className="text-[12px] font-bold px-3 py-1.5 rounded-xl text-white flex-shrink-0 ml-2"
                              style={{ background: validatingAnniv ? "rgba(255,45,85,0.4)" : "#FF2D55", border: "none", cursor: "pointer" }}>
                              {validatingAnniv ? "…" : "Cadeau donné"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>{result.tampons} / {result.objectif} tampons</p>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(((result.tampons ?? 0) / (result.objectif ?? 1)) * 100, 100)}%`, background: "linear-gradient(90deg,#2F7BFF,#8B5CF6)", transition: "width 0.6s cubic-bezier(0.34,1.06,0.64,1)" }} />
                    </div>
                    <Link href={`/client/${result.walletId}`} className="text-[13px] font-medium mt-1" style={{ color: "var(--accent)" }}>Voir le profil</Link>
                  </>)}
                  {result.type === "recompense" && (<>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
                      style={{ background: "linear-gradient(135deg,rgba(0,122,255,0.10),rgba(139,92,246,0.10))", animation: "success-pop 0.45s cubic-bezier(0.34,1.56,0.64,1)" }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                        stroke="url(#rg)">
                        <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#007AFF"/><stop offset="100%" stopColor="#8B5CF6"/></linearGradient></defs>
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </div>
                    <p className="text-[13px] font-medium" style={{ color: "var(--fg-secondary)" }}>{result.prenom}</p>
                    <p className="text-[22px] font-bold tracking-tight"
                      style={{ background: "linear-gradient(135deg,#007AFF,#8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {result.nom_recompense}
                    </p>
                    <button onClick={handleValiderRecompense} disabled={validating}
                      className="w-full py-4 rounded-2xl font-bold text-white mt-1 text-[15px]"
                      style={{ background: validating ? "var(--border)" : "linear-gradient(135deg,#2F7BFF,#8B5CF6)", boxShadow: validating ? "none" : "0 6px 20px rgba(47,123,255,0.30)" }}>
                      {validating ? "Validation…" : "Valider"}
                    </button>
                    <Link href={`/client/${result.walletId}`} className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>Voir le profil</Link>
                  </>)}
                  {result.type === "choix_requis" && (<>
                    {result.birthday && (
                      <p className="text-[13px] font-semibold mb-2" style={{ color: "#FF2D55" }}>
                        Joyeux anniversaire {result.prenom} !
                        {result.birthday_offre && ` — ${result.birthday_offre}`}
                      </p>
                    )}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
                      style={{ background: "linear-gradient(135deg,rgba(0,122,255,0.10),rgba(139,92,246,0.10))", animation: "success-pop 0.45s cubic-bezier(0.34,1.56,0.64,1)" }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="url(#cg)">
                        <defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#007AFF"/><stop offset="100%" stopColor="#8B5CF6"/></linearGradient></defs>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <p className="text-[13px] font-medium" style={{ color: "var(--fg-secondary)" }}>{result.prenom}</p>
                    <p className="text-[16px] font-bold" style={{ color: "var(--fg)" }}>Palier atteint — {result.tampons} tampons</p>
                    <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>Quel est son choix ?</p>
                    <div className="w-full flex flex-col gap-2 mt-1">
                      <button
                        onClick={() => handleEnregistrerChoix("petit")}
                        disabled={enregistrantChoix}
                        className="w-full py-4 rounded-2xl font-bold text-white text-[15px]"
                        style={{ background: enregistrantChoix ? "var(--border)" : "linear-gradient(135deg,#2F7BFF,#8B5CF6)", boxShadow: enregistrantChoix ? "none" : "0 6px 20px rgba(47,123,255,0.30)" }}
                      >
                        {enregistrantChoix ? "…" : `Prendre : ${result.nom_recompense_petit}`}
                      </button>
                      <button
                        onClick={() => handleEnregistrerChoix("grand")}
                        disabled={enregistrantChoix}
                        className="w-full py-3 rounded-2xl font-semibold text-[14px]"
                        style={{ background: "var(--glass-bg)", color: "var(--fg)", border: "1px solid var(--border)" }}
                      >
                        {`Continuer vers : ${result.nom_recompense_grand}`}
                      </button>
                    </div>
                    <Link href={`/client/${result.walletId}`} className="text-[12px]" style={{ color: "var(--fg-tertiary)" }}>Voir le profil</Link>
                  </>)}
                  {result.type === "anti_doublon" && (<>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1" style={{ background: "rgba(255,159,10,0.10)" }}>
                      <span className="text-[26px] font-black" style={{ color: "#FF9F0A" }}>!</span>
                    </div>
                    <p className="text-[18px] font-bold" style={{ color: "var(--fg)" }}>Déjà enregistré — {result.prenom}</p>
                    {(result.secondes_restantes ?? 0) > 0 && (
                      <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>Prochain tampon dans {formatTemps(result.secondes_restantes ?? 0)}</p>
                    )}
                    {result.recompense_en_attente && (
                      <div className="w-full mt-1 p-3 rounded-2xl" style={{ background: "linear-gradient(135deg,rgba(0,122,255,0.06),rgba(139,92,246,0.06))", border: "1px solid rgba(139,92,246,0.2)" }}>
                        <p className="text-[13px] font-semibold mb-2" style={{ color: "var(--fg)" }}>
                          Récompense en attente — {result.nom_recompense || result.nom_recompense_grand || ""}
                        </p>
                        <button onClick={handleValiderRecompense} disabled={validating}
                          className="w-full py-3 rounded-xl font-bold text-white text-[14px]"
                          style={{ background: validating ? "var(--border)" : "linear-gradient(135deg,#007AFF,#8B5CF6)", border: "none", cursor: "pointer" }}>
                          {validating ? "Validation…" : "Valider la récompense"}
                        </button>
                      </div>
                    )}
                    <button onClick={() => result.walletId && handleTampon(result.walletId, true)} className="w-full py-3 rounded-2xl font-semibold mt-1" style={{ background: "rgba(255,59,48,0.08)", color: "#FF3B30", border: "1px solid rgba(255,59,48,0.2)" }}>
                      Forcer quand même
                    </button>
                  </>)}
                  {result.type === "not_found" && (<>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1" style={{ background: "rgba(255,59,48,0.08)", color: "#FF3B30" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </div>
                    <p className="text-[18px] font-bold" style={{ color: "var(--fg)" }}>Client non reconnu</p>
                  </>)}
                  {/* Prompt email si client sans email */}
                  {(result.type === "ok" || result.type === "recompense") && clientHasNoEmail === true && !clientEmailSaved && (
                    <div className="w-full mt-1 p-3 rounded-2xl" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                      <p className="text-[12px] font-semibold mb-2 text-left" style={{ color: "var(--fg-secondary)" }}>
                        {clientPrenomForEmail} n&apos;a pas d&apos;email — ajouter ?
                      </p>
                      <div style={{ display: "flex", gap: 6 }}>
                        <input type="email" placeholder="email@exemple.com" value={clientEmailInput}
                          onChange={e => setClientEmailInput(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl text-[13px] outline-none"
                          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }} />
                        <button disabled={!clientEmailInput.includes("@") || clientEmailSaving}
                          onClick={async () => {
                            if (!clientEmailInput.includes("@")) return;
                            setClientEmailSaving(true);
                            try {
                              if (clientTelForEmail) await setClientEmail(clientTelForEmail, clientEmailInput.trim());
                              fetch("/api/send-welcome-email", {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ email: clientEmailInput.trim(), prenom: clientPrenomForEmail, walletId: result.walletId, mode: "inscription" }),
                              }).catch(() => {});
                              setClientEmailSaved(true);
                            } catch { /* silent */ }
                            finally { setClientEmailSaving(false); }
                          }}
                          className="px-3 py-2 rounded-xl text-[12px] font-semibold text-white flex-shrink-0"
                          style={{ background: clientEmailInput.includes("@") && !clientEmailSaving ? "var(--accent)" : "var(--border)", border: "none", cursor: "pointer", opacity: clientEmailInput.includes("@") && !clientEmailSaving ? 1 : 0.5 }}>
                          {clientEmailSaving ? "…" : "OK"}
                        </button>
                      </div>
                    </div>
                  )}
                  {clientEmailSaved && (
                    <div className="w-full mt-1 py-2 px-3 rounded-xl flex items-center gap-2"
                      style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.2)" }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <p className="text-[12px] font-medium" style={{ color: "#34C759" }}>Email ajouté !</p>
                    </div>
                  )}

                  <button onClick={() => { setResult(null); startCamera(); }} className="w-full py-3 rounded-2xl font-semibold text-white mt-1" style={{ background: "linear-gradient(135deg,#2F7BFF,#8B5CF6)" }}>
                    Scanner un autre client
                  </button>
                </div>
              )}

              {/* État idle */}
              {!scanning && !loadingTampon && !result && (
                <SmokeCard style={{ minHeight: 300, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <style>{`
                    @keyframes vf-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
                    @keyframes vf-scan { 0%{transform:translateY(0);opacity:0} 8%{opacity:1} 88%{opacity:0.8} 100%{transform:translateY(132px);opacity:0} }
                    @media(prefers-reduced-motion:reduce){.vf-breathe,.vf-scan{animation:none!important}}
                  `}</style>

                  {/* Viewfinder animé */}
                  <div className="vf-breathe" style={{ animation: "vf-breathe 2s ease-in-out infinite", position: "relative", width: 140, height: 140, marginBottom: 20, flexShrink: 0 }}>
                    <svg width="140" height="140" viewBox="0 0 140 140" style={{ position: "absolute", inset: 0 }}>
                      <defs>
                        <linearGradient id="vfGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#2F7BFF"/>
                          <stop offset="100%" stopColor="#8B5CF6"/>
                        </linearGradient>
                      </defs>
                      <path d="M24,2 L8,2 Q2,2 2,8 L2,24" fill="none" stroke="url(#vfGrad)" strokeWidth="4" strokeLinecap="round"/>
                      <path d="M116,2 L132,2 Q138,2 138,8 L138,24" fill="none" stroke="url(#vfGrad)" strokeWidth="4" strokeLinecap="round"/>
                      <path d="M2,116 L2,132 Q2,138 8,138 L24,138" fill="none" stroke="url(#vfGrad)" strokeWidth="4" strokeLinecap="round"/>
                      <path d="M138,116 L138,132 Q138,138 132,138 L116,138" fill="none" stroke="url(#vfGrad)" strokeWidth="4" strokeLinecap="round"/>
                    </svg>
                    {/* Ligne de scan */}
                    <div className="vf-scan" style={{
                      position: "absolute", top: 4, left: 12, right: 12, height: 2,
                      background: "linear-gradient(to right, transparent, #2F7BFF 30%, #8B5CF6 70%, transparent)",
                      animation: "vf-scan 2.5s ease-in-out infinite", borderRadius: 1,
                    }} />
                  </div>

                  <p className="text-[17px] font-semibold mb-1.5" style={{ color: "var(--fg)" }}>{t.scan_scan_qr}</p>
                  <p className="text-[13px] mb-5 max-w-[220px] text-center" style={{ color: "var(--fg-secondary)" }}>
                    {t.scan_point_qr}
                  </p>

                  {cameraPermissionDenied ? (
                    <div className="text-center">
                      <p className="text-[13px] mb-3" style={{ color: "#FF3B30" }}>Autorisez la caméra dans les réglages</p>
                      <button
                        onClick={() => { try { /* @ts-ignore */ window.Capacitor?.Plugins?.App?.openUrl?.({ url: "app-settings:" }); } catch {} }}
                        className="px-5 py-2.5 rounded-2xl text-[13px] font-semibold"
                        style={{ background: "#EEF0FF", color: "#4B4FD6", border: "none", cursor: "pointer" }}
                      >
                        Ouvrir les réglages
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={startCamera}
                      className="w-full max-w-[200px] py-4 rounded-2xl text-white font-bold text-[15px]"
                      style={{ background: "linear-gradient(135deg,#2F7BFF,#8B5CF6)", boxShadow: "0 6px 20px rgba(47,123,255,0.35)" }}
                    >
                      {t.scan_enable_camera}
                    </button>
                  )}
                </SmokeCard>
              )}
            </div>

            <div className="hidden md:block rounded-2xl p-5 max-w-xs"
              style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
              <p className="text-[12px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--fg-tertiary)" }}>
                {t.scan_how}
              </p>
              {[t.scan_how_1, t.scan_how_2, t.scan_how_3].map((step, i) => (
                <div key={i} className="flex gap-3 mb-3 last:mb-0">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white mt-0.5"
                    style={{ background: "var(--accent)" }}>
                    {i + 1}
                  </div>
                  <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab Téléphone ── */}
        {tab === "telephone" && (
          <div className="max-w-md">
            <p className="text-[14px] mb-4" style={{ color: "var(--fg-secondary)" }}>
              {t.scan_search_phone_hint}
            </p>

            <div className="flex gap-2 mb-5">
              <input
                type="tel"
                placeholder="+212 6 00 00 00 00"
                value={phone}
                onChange={e => { setPhone(e.target.value); setPhoneResult(null); }}
                onKeyDown={e => e.key === "Enter" && rechercherParTelephone()}
                className="flex-1 px-4 py-3.5 rounded-2xl text-[15px] outline-none"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
              <button
                onClick={rechercherParTelephone}
                disabled={searching || !phone.trim()}
                className="px-5 py-3.5 rounded-2xl font-semibold text-white text-[14px]"
                style={{ background: "var(--accent)", opacity: !phone.trim() ? 0.5 : 1 }}
              >
                {searching ? "…" : t.scan_search_btn}
              </button>
            </div>

            {phoneResult === "not_found" && (
              <div className="rounded-2xl p-5 text-center"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                <p className="text-[16px] font-semibold mb-1" style={{ color: "var(--fg)" }}>{t.scan_not_found_title}</p>
                <p className="text-[13px] mb-4" style={{ color: "var(--fg-secondary)" }}>
                  {t.scan_not_found_body}
                </p>
                <Link href="/dashboard/clients" className="text-[14px] font-medium" style={{ color: "var(--accent)" }}>
                  {t.scan_add_manually}
                </Link>
              </div>
            )}

            {phoneResult && phoneResult !== "not_found" && (
              <div className="rounded-2xl p-5" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-[15px] flex-shrink-0" style={{ background: "var(--accent)" }}>
                    {(phoneResult.prenom?.[0] || "").toUpperCase()}{(phoneResult.nom?.[0] || "").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[16px] font-semibold" style={{ color: "var(--fg)" }}>
                      {phoneResult.prenom} {phoneResult.nom}
                    </p>
                    <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>
                      {phoneResult.tampons} {t.dash_stamps.toLowerCase()}
                      {phoneResult.recompense_en_attente && ` · ${t.clients_pending_reward}`}
                    </p>
                  </div>
                </div>
                <Link href={`/client/${phoneResult.wallet_id}`} className="w-full py-3.5 rounded-2xl text-center text-white font-semibold text-[14px] block" style={{ background: "var(--accent)", boxShadow: "0 4px 14px rgba(0,122,255,0.3)" }}>
                  {t.scan_access_profile}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Tab Nom ── */}
        {tab === "nom" && (
          <div className="max-w-md">
            <p className="text-[14px] mb-4" style={{ color: "var(--fg-secondary)" }}>
              {t.scan_search_name_hint}
            </p>

            <div className="flex gap-2 mb-5">
              <input
                type="text"
                placeholder={t.scan_name_placeholder}
                value={nom}
                onChange={e => { setNom(e.target.value); setNomResults(null); }}
                onKeyDown={e => e.key === "Enter" && rechercherParNom()}
                className="flex-1 px-4 py-3.5 rounded-2xl text-[15px] outline-none"
                style={{ background: "var(--glass-bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
              <button
                onClick={rechercherParNom}
                disabled={searchingNom || !nom.trim()}
                className="px-5 py-3.5 rounded-2xl font-semibold text-white text-[14px]"
                style={{ background: "var(--accent)", opacity: !nom.trim() ? 0.5 : 1 }}
              >
                {searchingNom ? "…" : t.scan_search_btn}
              </button>
            </div>

            {nomResults !== null && nomResults.length === 0 && (
              <div className="rounded-2xl p-5 text-center" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                <p className="text-[16px] font-semibold mb-1" style={{ color: "var(--fg)" }}>{t.scan_no_result}</p>
                <p className="text-[13px]" style={{ color: "var(--fg-secondary)" }}>
                  {t.scan_no_result_body} &quot;{nom}&quot;.
                </p>
              </div>
            )}

            {nomResults && nomResults.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--glass-bg)", border: "1px solid var(--border)" }}>
                {nomResults.map((c, i) => (
                  <Link key={c.id} href={`/client/${c.wallet_id}`}
                    className="flex items-center gap-3.5 px-5 py-4 transition-opacity active:opacity-70"
                    style={{ borderBottom: i < nomResults.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-[13px] flex-shrink-0" style={{ background: "var(--accent)" }}>
                      {(c.prenom?.[0] || "").toUpperCase()}{(c.nom?.[0] || "").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold truncate" style={{ color: "var(--fg)" }}>
                        {c.prenom} {c.nom}
                      </p>
                      <p className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>
                        {c.tampons} {t.dash_stamps.toLowerCase()}
                        {c.recompense_en_attente && ` · ${t.clients_pending_reward}`}
                      </p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M9 18l6-6-6-6" stroke="var(--fg-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      {/* Derniers scans */}
      {recentScans.length > 0 && (
        <div className="px-5 md:px-8 lg:px-10 mt-4 max-w-md">
          <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-[13px] font-semibold" style={{ color: "var(--fg)" }}>Derniers scans</p>
              <Link href="/dashboard/historique" className="text-[12px]" style={{ color: "var(--accent)" }}>Voir tout</Link>
            </div>
            {recentScans.map((s, i) => {
              const initials = `${(s.prenom?.[0] || "").toUpperCase()}${(s.nom?.[0] || "").toUpperCase()}`;
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < recentScans.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEF0FF", color: "#4B4FD6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: "var(--fg)" }}>
                      {formatName(s.prenom)} {formatName(s.nom)}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--fg-tertiary)" }}>
                      {s.ts ? formatTempsDepuis({ seconds: new Date(s.ts).getTime() / 1000 } as never) : "—"}
                    </p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#2F7BFF" }}>+1</span>
                </div>
              );
            })}
          </div>
        </div>
      )}


</div>
    </div>
  );
}
