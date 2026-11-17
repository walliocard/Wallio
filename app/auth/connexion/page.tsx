"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithCustomToken } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { haptic } from "@/lib/haptics";
import {
  isPasskeySupported,
  isPasskeyRegistered,
  authenticateGerantWithPasskey,
} from "@/lib/passkey-client";
import { useLang } from "@/lib/lang-context";
import AmbientBackground from "@/components/AmbientBackground";

const SUPPORT_WA = "https://wa.me/212654768191";
const MODE_KEY   = "wallio_last_mode";
const EQUIPE_KEY = "equipe_etablissement";

type Mode = "gerant" | "equipe";
type EquipeStep = "code" | "prenom" | "pin";

// ── Icons ──────────────────────────────────────────────────────────────────

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function FaceIdIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

// ── Segmented control ──────────────────────────────────────────────────────

function SegmentedControl({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div style={{ position: "relative", display: "flex", background: "rgba(118,118,128,0.12)", borderRadius: 9, height: 36, padding: 2 }}>
      <div style={{
        position: "absolute", top: 2, left: 2,
        width: "calc(50% - 2px)", height: 32, borderRadius: 7,
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 1px rgba(0,0,0,0.06)",
        transform: mode === "equipe" ? "translateX(calc(100%))" : "translateX(0)",
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        pointerEvents: "none",
      }} />
      {(["gerant", "equipe"] as Mode[]).map(m => (
        <button key={m} onClick={() => onChange(m)} style={{
          flex: 1, position: "relative", zIndex: 1,
          background: "transparent", border: "none",
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          color: mode === m ? "#1D1D1F" : "rgba(0,0,0,0.45)",
          transition: "color 0.2s ease",
        }}>
          {m === "gerant" ? "Gérant" : "Équipe"}
        </button>
      ))}
    </div>
  );
}

// ── Code 6 cases ───────────────────────────────────────────────────────────

function CodeBoxInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, raw: string) => {
    const char = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-1);
    const arr = (value + "      ").slice(0, 6).split("");
    arr[i] = char;
    const next = arr.join("").trimEnd();
    onChange(next);
    if (char && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      const arr = (value + "      ").slice(0, 6).split("");
      arr[i - 1] = "";
      onChange(arr.join("").trimEnd());
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div style={{ display: "flex", gap: 8, width: "100%" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          value={value[i] || ""}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          maxLength={2}
          disabled={disabled}
          inputMode="text"
          autoCapitalize="characters"
          style={{
            flex: 1, minWidth: 0, height: 52, background: "white",
            border: "1px solid #E5E5EA", borderRadius: 14,
            textAlign: "center", fontSize: 20, fontWeight: 700,
            color: "#1D1D1F", outline: "none",
            fontVariantNumeric: "tabular-nums",
            transition: "border-color 0.15s ease",
          }}
          onFocus={e => { e.target.style.borderColor = "#2F7BFF"; e.target.style.boxShadow = "0 0 0 4px rgba(47,123,255,0.12)"; }}
          onBlur={e => { e.target.style.borderColor = "#E5E5EA"; e.target.style.boxShadow = "none"; }}
        />
      ))}
    </div>
  );
}

// ── PIN 4 points ───────────────────────────────────────────────────────────

function PinInput({ value, error, onChange }: { value: string; error: boolean; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => ref.current?.focus(), 100); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div
        style={{ display: "flex", gap: 18, cursor: "text", animation: error ? "shake 0.4s ease" : undefined }}
        onClick={() => ref.current?.focus()}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: "50%",
            background: i < value.length ? "#1D1D1F" : "rgba(0,0,0,0.12)",
            transition: "background 0.1s ease, transform 0.1s ease",
            transform: i < value.length ? "scale(1)" : "scale(0.85)",
            animation: i === value.length - 1 && value.length > 0 ? "dot-pop 0.15s ease" : undefined,
          }} />
        ))}
      </div>
      <input
        ref={ref}
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
        maxLength={4}
        autoComplete="one-time-code"
        style={{ position: "absolute", opacity: 0, width: 1, height: 1, pointerEvents: "none" }}
      />
    </div>
  );
}

// ── Connexion principale ───────────────────────────────────────────────────

function ConnexionInner() {
  const { t } = useLang();
  const router = useRouter();

  const [mode, setMode]           = useState<Mode>("gerant");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [shaking, setShaking]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [logoSmall, setLogoSmall] = useState(false);

  const [passkeyAvail, setPasskeyAvail]   = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  // Équipe
  const [equipeStep, setEquipeStep]   = useState<EquipeStep>("code");
  const [equipeData, setEquipeData]   = useState<{ marchandId: string; marchandNom: string; membres: { id: string; prenom: string }[] } | null>(null);
  const [code, setCode]               = useState("");
  const [membre, setMembre]           = useState<{ id: string; prenom: string } | null>(null);
  const [pin, setPin]                 = useState("");
  const [pinError, setPinError]       = useState(false);
  const [equipeLoading, setEquipeLoading] = useState(false);
  const [equipeError, setEquipeError]   = useState("");

  // Mémoriser le dernier mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY) as Mode | null;
      if (saved === "equipe") setMode("equipe");
    } catch {}
  }, []);

  const changeMode = (m: Mode) => {
    setMode(m);
    setError(""); setEquipeError("");
    try { localStorage.setItem(MODE_KEY, m); } catch {}
  };

  // Pré-charger l'établissement mémorisé pour équipe
  useEffect(() => {
    if (mode !== "equipe") return;
    try {
      const stored = localStorage.getItem(EQUIPE_KEY);
      if (!stored) return;
      const data = JSON.parse(stored);
      setEquipeData(data);
      setEquipeStep("prenom");
    } catch {}
  }, [mode]);

  // Rétrécissement logo au clavier
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setLogoSmall(window.innerHeight - vv.height > 150);
    vv.addEventListener("resize", onResize, { passive: true });
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  // Passkey disponible ?
  useEffect(() => {
    isPasskeySupported().then(async supported => {
      if (!supported) return;
      try { setPasskeyAvail(localStorage.getItem("wallio_pk_gerant") === "1"); } catch {}
    });
  }, []);

  // Auto-valider PIN au 4e chiffre
  useEffect(() => {
    if (pin.length === 4 && membre && equipeData) {
      handleAuthMembre();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const shake = useCallback(async (msg: string) => {
    setError(msg);
    setShaking(true);
    await haptic("error");
    setTimeout(() => setShaking(false), 450);
  }, []);

  // ── Gérant : connexion email/mdp ──────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(""); setLoading(true);
    try {
      const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 15000));
      const cred = await Promise.race([signInWithEmailAndPassword(auth, email, password), timeout]);
      const uid = cred.user.uid;
      const snap = await getDoc(doc(db, "marchands", uid));
      if (!snap.exists()) { shake("Compte marchand introuvable. Vérifiez vos identifiants."); return; }
      await haptic("success");
      setSuccess(true);
      await new Promise(r => setTimeout(r, 320));
      if (typeof window !== "undefined" && "Capacitor" in window) {
        window.location.replace("/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      shake(msg === "timeout" || msg.includes("network") || msg.includes("unavailable")
        ? t.auth_error_slow
        : t.auth_error_wrong);
    } finally { setLoading(false); }
  }

  // ── Gérant : Face ID ──────────────────────────────────────────────────

  async function handleFaceId() {
    setPasskeyLoading(true);
    try {
      const result = await authenticateGerantWithPasskey();
      if (!result) { try { localStorage.removeItem("wallio_pk_gerant"); } catch {} setPasskeyAvail(false); return; }
      await signInWithCustomToken(auth, result.customToken);
      await haptic("success");
      setSuccess(true);
      await new Promise(r => setTimeout(r, 320));
      if (typeof window !== "undefined" && "Capacitor" in window) {
        window.location.replace("/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch {
      try { localStorage.removeItem("wallio_pk_gerant"); } catch {}
      setPasskeyAvail(false);
    } finally { setPasskeyLoading(false); }
  }

  // ── Équipe : valider code ─────────────────────────────────────────────

  async function handleValiderCode(e: React.FormEvent) {
    e.preventDefault();
    setEquipeLoading(true); setEquipeError("");
    try {
      const res = await fetch("/api/equipe/valider-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.toUpperCase() }) });
      const data = await res.json();
      if (!res.ok) { setEquipeError(data.error || "Code invalide"); return; }
      setEquipeData(data);
      try { localStorage.setItem(EQUIPE_KEY, JSON.stringify(data)); } catch {}
      setEquipeStep("prenom");
    } catch { setEquipeError("Erreur de connexion."); }
    finally { setEquipeLoading(false); }
  }

  // ── Équipe : auth membre PIN ──────────────────────────────────────────

  async function handleAuthMembre() {
    if (!equipeData || !membre) return;
    setEquipeLoading(true); setEquipeError("");
    try {
      const res = await fetch("/api/equipe/auth-membre", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marchandId: equipeData.marchandId, membreId: membre.id, pin }) });
      const data = await res.json();
      if (!res.ok) {
        setPinError(true);
        await haptic("error");
        setTimeout(() => { setPinError(false); setPin(""); }, 500);
        setEquipeError(data.error || "PIN incorrect");
        return;
      }
      try {
        localStorage.setItem("equipe_session", JSON.stringify({
          token: data.token, prenom: data.prenom, marchandId: data.marchandId,
          marchandNom: data.marchandNom, logo_url: data.logo_url || null, permissions: data.permissions,
        }));
      } catch {}
      await haptic("success");
      router.push("/equipe/clients");
    } catch { setEquipeError("Erreur de connexion."); }
    finally { setEquipeLoading(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 52, background: "white",
    border: "1px solid #E5E5EA", borderRadius: 14,
    fontSize: 15, padding: "0 16px",
    color: "#1D1D1F", outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    WebkitAppearance: "none",
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#2F7BFF";
    e.target.style.boxShadow = "0 0 0 4px rgba(47,123,255,0.12)";
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#E5E5EA";
    e.target.style.boxShadow = "none";
  };

  return (
    <main
      style={{
        minHeight: "100dvh", background: "linear-gradient(to bottom, rgba(130,110,250,0.18) 0, rgba(130,110,250,0) 80px), #F7F7FA", position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "env(safe-area-inset-top, 0px) 20px env(safe-area-inset-bottom, 24px)",
        animation: success ? "connexion-exit 0.35s ease-in forwards" : undefined,
      }}
      onClick={e => { if (e.target === e.currentTarget) (document.activeElement as HTMLElement)?.blur(); }}
    >
      <AmbientBackground variant="login" />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 390, flex: 1, display: "flex", flexDirection: "column" }}>

        {/* ── Header logo + titre ── */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          marginTop: "22%",
          transform: logoSmall ? "scale(0.65) translateY(-20px)" : "scale(1) translateY(0)",
          transformOrigin: "top center",
          transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          animation: "icon-entrance 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        }}>
          <img
            id="login-logo"
            src="/icon-pro-512.png"
            width={72} height={72}
            alt="Wallio"
            style={{ borderRadius: 16.5, boxShadow: "0 8px 24px rgba(91,92,240,0.25)", display: "block" }}
          />
          <p style={{ fontSize: 28, fontWeight: 700, color: "#1D1D1F", marginTop: 16, letterSpacing: "-0.5px" }}>Wallio Pro</p>
          <p style={{ fontSize: 15, color: "#8E8E93", marginTop: 4 }}>Espace commerçant</p>
        </div>

        {/* ── Sélecteur Gérant / Équipe ── */}
        <div style={{ marginTop: 32, animation: "stagger-in 0.35s 0.08s cubic-bezier(0.34,1.06,0.64,1) both" }}>
          <SegmentedControl mode={mode} onChange={changeMode} />
        </div>

        {/* ── Contenu mode ── */}
        <div style={{
          marginTop: 28, flex: 1,
          animation: "stagger-in 0.35s 0.14s cubic-bezier(0.34,1.06,0.64,1) both",
        }}>

          {/* ══ GÉRANT ══ */}
          {mode === "gerant" && (
            <div>
              {/* Face ID */}
              {passkeyAvail && (
                <button
                  onClick={handleFaceId}
                  disabled={passkeyLoading || loading}
                  style={{
                    width: "100%", height: 52, borderRadius: 14, marginBottom: 16,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    background: "white", border: "1px solid #E5E5EA",
                    fontSize: 15, fontWeight: 600, color: "#1D1D1F", cursor: "pointer",
                  }}
                >
                  <FaceIdIcon />
                  {passkeyLoading ? "Vérification…" : "Connexion avec Face ID"}
                </button>
              )}
              {passkeyAvail && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 16px" }}>
                  <div style={{ flex: 1, height: 1, background: "#E5E5EA" }} />
                  <span style={{ fontSize: 12, color: "#8E8E93" }}>ou</span>
                  <div style={{ flex: 1, height: 1, background: "#E5E5EA" }} />
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  autoComplete="username"
                  autoCapitalize="none"
                  inputMode="email"
                  enterKeyHint="next"
                  style={inputStyle}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />

                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    placeholder="Mot de passe"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(""); }}
                    autoComplete="current-password"
                    enterKeyHint="go"
                    style={{ ...inputStyle, paddingRight: 48 }}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      background: "transparent", border: "none", cursor: "pointer",
                      color: "#8E8E93", padding: 4,
                    }}
                  >
                    <EyeIcon visible={showPass} />
                  </button>
                </div>

                {/* Erreur */}
                {error && (
                  <p style={{ fontSize: 13, color: "#FF3B30", animation: "fade-in 0.2s ease" }}>
                    {error}
                  </p>
                )}

                {/* Mot de passe oublié */}
                <div style={{ textAlign: "right", marginTop: -4 }}>
                  <button
                    type="button"
                    onClick={async () => {
                      const { sendPasswordResetEmail } = await import("firebase/auth");
                      if (!email) { shake("Entrez votre email d'abord."); return; }
                      try { await sendPasswordResetEmail(auth, email); setError("Email de réinitialisation envoyé."); } catch { shake("Email introuvable."); }
                    }}
                    style={{ fontSize: 13, color: "#2F7BFF", background: "transparent", border: "none", cursor: "pointer" }}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                {/* Bouton connexion */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%", height: 54, borderRadius: 16, marginTop: 12,
                    background: loading ? "rgba(47,123,255,0.5)" : "linear-gradient(135deg, #2F7BFF 0%, #8B5CF6 100%)",
                    boxShadow: loading ? "none" : "0 4px 16px rgba(47,123,255,0.3)",
                    border: "none", cursor: loading ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: shaking ? "shake 0.4s ease" : undefined,
                    transition: "background 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  {loading ? (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />
                  ) : (
                    <span style={{ fontSize: 16, fontWeight: 600, color: "white" }}>Se connecter</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ══ ÉQUIPE — Étape code ══ */}
          {mode === "equipe" && equipeStep === "code" && (
            <form onSubmit={handleValiderCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <p style={{ fontSize: 17, fontWeight: 600, color: "#1D1D1F" }}>Code de l&apos;établissement</p>
                <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 4 }}>Demandez-le à votre gérant</p>
              </div>
              <CodeBoxInput value={code} onChange={setCode} disabled={equipeLoading} />
              {equipeError && <p style={{ fontSize: 13, color: "#FF3B30", textAlign: "center", animation: "fade-in 0.2s ease" }}>{equipeError}</p>}
              <button
                type="submit"
                disabled={equipeLoading || code.length < 6}
                style={{
                  width: "100%", height: 54, borderRadius: 16,
                  background: code.length >= 6 ? "linear-gradient(135deg, #2F7BFF 0%, #8B5CF6 100%)" : "#E5E5EA",
                  boxShadow: code.length >= 6 ? "0 4px 16px rgba(47,123,255,0.3)" : "none",
                  border: "none", cursor: code.length >= 6 ? "pointer" : "default",
                  fontSize: 16, fontWeight: 600, color: code.length >= 6 ? "white" : "#8E8E93",
                  transition: "all 0.2s ease",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {equipeLoading ? (
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />
                ) : "Continuer"}
              </button>
            </form>
          )}

          {/* ══ ÉQUIPE — Étape choix prénom ══ */}
          {mode === "equipe" && equipeStep === "prenom" && equipeData && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <p style={{ fontSize: 17, fontWeight: 600, color: "#1D1D1F" }}>{equipeData.marchandNom}</p>
                <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 4 }}>Qui êtes-vous ?</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {equipeData.membres.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMembre(m); setEquipeStep("pin"); setEquipeError(""); setPin(""); }}
                    style={{
                      width: "100%", height: 54, borderRadius: 14,
                      background: "white", border: "1px solid #E5E5EA",
                      fontSize: 16, fontWeight: 600, color: "#1D1D1F",
                      cursor: "pointer", textAlign: "left", padding: "0 20px",
                    }}
                    onTouchStart={e => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
                    onTouchEnd={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  >
                    {m.prenom}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setEquipeStep("code"); setEquipeData(null); try { localStorage.removeItem(EQUIPE_KEY); } catch {} }}
                style={{ width: "100%", marginTop: 20, fontSize: 14, color: "#8E8E93", background: "transparent", border: "none", cursor: "pointer", padding: "8px 0" }}
              >
                ← Changer de code
              </button>
            </div>
          )}

          {/* ══ ÉQUIPE — Étape PIN ══ */}
          {mode === "equipe" && equipeStep === "pin" && membre && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 17, fontWeight: 600, color: "#1D1D1F" }}>Bonjour, {membre.prenom}</p>
                <p style={{ fontSize: 14, color: "#8E8E93", marginTop: 4 }}>Saisissez votre PIN</p>
              </div>
              <PinInput value={pin} error={pinError} onChange={setPin} />
              {equipeError && <p style={{ fontSize: 13, color: "#FF3B30", textAlign: "center" }}>{equipeError}</p>}
              {equipeLoading && <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid rgba(0,0,0,0.1)", borderTopColor: "#1D1D1F", animation: "spin 0.7s linear infinite" }} />}
              <button
                onClick={() => { setEquipeStep("prenom"); setPin(""); setEquipeError(""); }}
                style={{ fontSize: 14, color: "#8E8E93", background: "transparent", border: "none", cursor: "pointer", padding: "4px 0" }}
              >
                ← Ce n&apos;est pas moi
              </button>
            </div>
          )}
        </div>

        {/* ── Besoin d'aide ── */}
        <div style={{ textAlign: "center", paddingBottom: 24, paddingTop: 24 }}>
          <a href={SUPPORT_WA} style={{ fontSize: 13, color: "#8E8E93", textDecoration: "none" }}>
            Besoin d&apos;aide ?
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}

export default function ConnexionPage() {
  return <ConnexionInner />;
}
