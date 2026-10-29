"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithCustomToken, signOut, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import WallioLogo from "@/components/WallioLogo";
import {
  isPasskeySupported,
  isPasskeyRegistered,
  registerPasskeyForGerant,
  authenticateGerantWithPasskey,
} from "@/lib/passkey-client";

function isPrivateMode(): boolean {
  try { const k = "__w__"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return false; } catch { return true; }
}

type EquipeStep = "code" | "prenom" | "pin";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 16px", borderRadius: 16, fontSize: 15,
  outline: "none", transition: "border-color 0.2s",
  background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
  color: "white", boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  width: "100%", padding: "14px 0", borderRadius: 16, fontSize: 15,
  fontWeight: 600, color: "white", background: "var(--accent)",
  boxShadow: "0 4px 16px rgba(0,122,255,0.3)", border: "none", cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  width: "100%", fontSize: 13, textAlign: "center",
  color: "rgba(255,255,255,0.35)", background: "transparent", border: "none", cursor: "pointer",
};

function ConnexionInner() {
  const { t } = useLang();

  const [mode, setMode] = useState<"gerant" | "equipe">("gerant");
  const [equipeStep, setEquipeStep] = useState<EquipeStep>("code");
  const [equipeData, setEquipeData] = useState<{ marchandId: string; marchandNom: string; membres: { id: string; prenom: string }[] } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("inactive")) setError(t.auth_inactive);
    if (params.get("changer") === "1") {
      try {
        const stored = localStorage.getItem("equipe_etablissement");
        if (!stored) return;
        const data = JSON.parse(stored);
        setEquipeData(data);
        setMode("equipe");
        setEquipeStep("prenom");
      } catch {}
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [privateMode] = useState(() => typeof window !== "undefined" && isPrivateMode());
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [code, setCode] = useState("");
  const [membreSelectionne, setMembreSelectionne] = useState<{ id: string; prenom: string } | null>(null);
  const [pin, setPin] = useState("");
  const [equipeError, setEquipeError] = useState("");
  const [equipeLoading, setEquipeLoading] = useState(false);

  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [gerantPasskeyBanner, setGerantPasskeyBanner] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");

  useEffect(() => {
    isPasskeySupported().then(supported => {
      if (supported) {
        try { setPasskeyAvailable(localStorage.getItem("wallio_pk_gerant") === "1"); } catch {}
      }
    });
  }, []);

  async function handleReset() {
    if (!form.email) { setError(t.auth_error_email); return; }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, form.email);
      setResetSent(true); setError("");
    } catch {
      setError(t.auth_error_not_found);
    } finally { setResetLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      try { Object.keys(localStorage).forEach(k => { if (k.startsWith("firebase:authUser:")) localStorage.removeItem(k); }); } catch {}
      const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 15000));
      const cred = await Promise.race([signInWithEmailAndPassword(auth, form.email, form.password), timeout]);
      const uid = cred.user.uid;
      const marchandSnap = await getDoc(doc(db, "marchands", uid));
      if (!marchandSnap.exists()) { signOut(auth).catch(() => {}); setError("Compte marchand introuvable. Vérifiez vos identifiants."); return; }
      const supported = await isPasskeySupported();
      if (supported) {
        const deviceHasIt = (() => { try { return localStorage.getItem("wallio_pk_gerant") === "1"; } catch { return false; } })();
        const already = await isPasskeyRegistered(`gerant:${uid}`);
        if (already && deviceHasIt) { /* OK */ } else { setGerantPasskeyBanner(uid); return; }
      }
      window.location.href = "/dashboard";
    } catch (e: unknown) {
      signOut(auth).catch(() => {});
      const msg = e instanceof Error ? e.message : "";
      setError(msg === "timeout" || msg.includes("network") || msg.includes("unavailable") ? t.auth_error_slow : t.auth_error_wrong);
    } finally { setLoading(false); }
  }

  async function handleValiderCode(e: React.FormEvent) {
    e.preventDefault(); setEquipeLoading(true); setEquipeError("");
    try {
      const res = await fetch("/api/equipe/valider-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.toUpperCase() }) });
      const data = await res.json();
      if (!res.ok) { setEquipeError(data.error || "Code invalide"); return; }
      setEquipeData(data);
      localStorage.setItem("equipe_etablissement", JSON.stringify(data));
      setEquipeStep("prenom");
    } catch { setEquipeError("Erreur de connexion. Réessayez."); }
    finally { setEquipeLoading(false); }
  }

  async function handleGerantFaceId() {
    setPasskeyLoading(true); setPasskeyError("");
    try {
      const result = await authenticateGerantWithPasskey();
      if (!result) {
        try { localStorage.removeItem("wallio_pk_gerant"); } catch {}
        setPasskeyAvailable(false);
        setPasskeyError("Clé d'accès introuvable. Reconnectez-vous avec votre mot de passe pour la recréer.");
        return;
      }
      await signInWithCustomToken(auth, result.customToken);
      window.location.href = "/dashboard";
    } catch {
      try { localStorage.removeItem("wallio_pk_gerant"); } catch {}
      setPasskeyAvailable(false);
      setPasskeyError("Erreur Face ID. Utilisez email et mot de passe.");
    } finally { setPasskeyLoading(false); }
  }

  async function handleAuthMembre(e: React.FormEvent) {
    e.preventDefault();
    if (!equipeData || !membreSelectionne) return;
    setEquipeLoading(true); setEquipeError("");
    try {
      const res = await fetch("/api/equipe/auth-membre", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marchandId: equipeData.marchandId, membreId: membreSelectionne.id, pin }) });
      const data = await res.json();
      if (!res.ok) { setEquipeError(data.error || "PIN incorrect"); return; }
      localStorage.setItem("equipe_session", JSON.stringify({ token: data.token, prenom: data.prenom, marchandId: data.marchandId, marchandNom: data.marchandNom, logo_url: data.logo_url || null, permissions: data.permissions }));
      window.location.href = "/equipe/scanner";
    } catch { setEquipeError("Erreur de connexion. Réessayez."); }
    finally { setEquipeLoading(false); }
  }

  return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "env(safe-area-inset-top) 20px env(safe-area-inset-bottom)", background: "#F2F2F7" }}>

      {/* Gradient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: 600, height: 500, borderRadius: "50%", opacity: 0.4, background: "radial-gradient(circle, rgba(0,122,255,0.10) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "30%", width: 400, height: 400, borderRadius: "50%", opacity: 0.2, background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 360, position: "relative" }}>

        {/* Logo + titre */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <WallioLogo size={52} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", color: "#1D1D1F", margin: 0 }}>Wallio Pro</h1>
          <p style={{ fontSize: 14, marginTop: 4, color: "#6E6E73", margin: "4px 0 0" }}>Tableau de bord marchand</p>
        </div>

        {/* Card */}
        <div style={{ borderRadius: 24, overflow: "hidden", background: "rgba(20,20,22,0.82)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>

          {/* Toggle Gérant / Équipe */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {(["gerant", "equipe"] as const).map(m => (
              <button key={m}
                onClick={() => { setMode(m); setError(""); setEquipeError(""); setEquipeStep("code"); setCode(""); setPin(""); }}
                style={{
                  flex: 1, padding: "14px 0", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  color: mode === m ? "white" : "rgba(255,255,255,0.35)",
                  background: "transparent",
                  borderTop: "none", borderLeft: "none", borderRight: "none",
                  borderBottom: `2px solid ${mode === m ? "var(--accent)" : "transparent"}`,
                  transition: "color 0.15s",
                }}>
                {m === "gerant" ? "Gérant" : "Équipe"}
              </button>
            ))}
          </div>

          <div style={{ padding: 24 }}>

            {/* ── Banner passkey gérant ── */}
            {gerantPasskeyBanner && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "center" }}>
                <p style={{ fontSize: 17, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Connexion rapide</p>
                <p style={{ fontSize: 14, color: "var(--fg-secondary)", margin: 0 }}>
                  Activer Face ID / Empreinte pour vous connecter sans mot de passe la prochaine fois ?
                </p>
                <button
                  onClick={async () => {
                    const ok = await registerPasskeyForGerant(gerantPasskeyBanner);
                    try { if (ok) localStorage.setItem("wallio_pk_gerant", "1"); else localStorage.removeItem("wallio_pk_gerant"); } catch {}
                    window.location.href = "/dashboard";
                  }}
                  style={btnPrimary}>
                  Activer Face ID
                </button>
                <button onClick={() => { window.location.href = "/dashboard"; }} style={btnGhost}>
                  Plus tard
                </button>
              </div>
            )}

            {/* ── Formulaire Gérant ── */}
            {!gerantPasskeyBanner && mode === "gerant" && (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fade-in 0.25s ease" }}>
                {passkeyAvailable && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button type="button" onClick={handleGerantFaceId} disabled={passkeyLoading}
                      style={{ width: "100%", padding: "14px 16px", borderRadius: 16, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white", cursor: "pointer" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      {passkeyLoading ? "Vérification…" : "Face ID / Empreinte"}
                    </button>
                    {passkeyError && <p style={{ fontSize: 12, textAlign: "center", color: "#ef4444", margin: 0 }}>{passkeyError}</p>}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
                      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>ou</span>
                      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input type="email" required placeholder={t.auth_email} value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "rgba(0,122,255,0.7)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
                  <input type="password" required placeholder={t.auth_password} value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "rgba(0,122,255,0.7)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
                </div>
                {privateMode && (
                  <p style={{ fontSize: 12, padding: "8px 16px", borderRadius: 12, textAlign: "center", background: "rgba(255,159,10,0.1)", color: "#FF9F0A", margin: 0 }}>
                    Navigation privée détectée — la session ne sera pas mémorisée après fermeture.
                  </p>
                )}
                {error && <p key={error} style={{ fontSize: 13, color: "#ef4444", margin: 0, animation: "shake 0.4s ease-in-out" }}>{error}</p>}
                <button type="submit" disabled={loading} style={btnPrimary}>
                  {loading ? t.auth_logging_in : t.auth_login}
                </button>
              </form>
            )}

            {/* ── Flow Équipe — Étape 1 : Code ── */}
            {!gerantPasskeyBanner && mode === "equipe" && equipeStep === "code" && (
              <form onSubmit={handleValiderCode} style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fade-in 0.25s ease" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 17, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Code de l&apos;établissement</p>
                  <p style={{ fontSize: 13, marginTop: 4, color: "var(--fg-secondary)", margin: "4px 0 0" }}>Demandez-le à votre gérant</p>
                </div>
                <input
                  type="text" required maxLength={6} placeholder="Ex : X7K3P2"
                  value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  style={{ ...inputStyle, padding: 16, fontSize: 22, fontWeight: 700, textAlign: "center", letterSpacing: "0.3em" }}
                  onFocus={e => e.target.style.borderColor = "rgba(0,122,255,0.7)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                />
                {equipeError && <p key={equipeError} style={{ fontSize: 13, color: "#ef4444", textAlign: "center", margin: 0, animation: "shake 0.4s ease-in-out" }}>{equipeError}</p>}
                <button type="submit" disabled={equipeLoading || code.length !== 6}
                  style={{ ...btnPrimary, background: code.length === 6 ? "var(--accent)" : "var(--border)", opacity: equipeLoading ? 0.7 : 1 }}>
                  {equipeLoading ? "Vérification…" : "Continuer"}
                </button>
              </form>
            )}

            {/* ── Flow Équipe — Étape 2 : Choix prénom ── */}
            {!gerantPasskeyBanner && mode === "equipe" && equipeStep === "prenom" && equipeData && (
              <div>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <p style={{ fontSize: 17, fontWeight: 600, color: "var(--fg)", margin: 0 }}>{equipeData.marchandNom}</p>
                  <p style={{ fontSize: 13, marginTop: 4, color: "var(--fg-secondary)", margin: "4px 0 0" }}>Qui êtes-vous ?</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {equipeData.membres.map(m => (
                    <button key={m.id}
                      onClick={() => { setMembreSelectionne(m); setEquipeStep("pin"); setEquipeError(""); }}
                      onTouchStart={e => (e.currentTarget as HTMLElement).style.opacity = "0.75"}
                      onTouchEnd={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
                      style={{ width: "100%", padding: "14px 20px", borderRadius: 16, fontSize: 16, fontWeight: 600, textAlign: "left", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white", cursor: "pointer", transition: "opacity 0.15s" }}>
                      {m.prenom}
                    </button>
                  ))}
                </div>
                <button onClick={() => setEquipeStep("code")} style={{ ...btnGhost, marginTop: 16 }}>
                  ← Changer de code
                </button>
              </div>
            )}

            {/* ── Flow Équipe — Étape 3 : PIN ── */}
            {!gerantPasskeyBanner && mode === "equipe" && equipeStep === "pin" && membreSelectionne && (
              <form onSubmit={handleAuthMembre} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 17, fontWeight: 600, color: "var(--fg)", margin: 0 }}>Bonjour, {membreSelectionne.prenom}</p>
                  <p style={{ fontSize: 13, marginTop: 4, color: "var(--fg-secondary)", margin: "4px 0 0" }}>Saisissez votre PIN</p>
                </div>
                <input
                  type="password" inputMode="numeric" maxLength={4} required placeholder="••••" autoComplete="one-time-code"
                  value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  style={{ ...inputStyle, padding: 16, fontSize: 28, fontWeight: 700, textAlign: "center", letterSpacing: "0.5em" }}
                  onFocus={e => e.target.style.borderColor = "rgba(0,122,255,0.7)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                  autoFocus
                />
                {equipeError && <p style={{ fontSize: 13, color: "#ef4444", textAlign: "center", margin: 0 }}>{equipeError}</p>}
                <button type="submit" disabled={equipeLoading || pin.length !== 4}
                  style={{ ...btnPrimary, background: pin.length === 4 ? "var(--accent)" : "var(--border)", opacity: equipeLoading ? 0.7 : 1 }}>
                  {equipeLoading ? "Connexion…" : "Se connecter"}
                </button>
                <button type="button" onClick={() => { setEquipeStep("prenom"); setPin(""); setEquipeError(""); }} style={btnGhost}>
                  ← Ce n&apos;est pas moi
                </button>
              </form>
            )}

          </div>
        </div>

        {mode === "gerant" && (
          <>
            {resetSent && <p style={{ textAlign: "center", fontSize: 13, marginTop: 16, color: "#34C759", margin: "16px 0 0" }}>{t.auth_reset_sent}</p>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, padding: "0 4px" }}>
              <button onClick={handleReset} disabled={resetLoading} style={{ fontSize: 13, color: "#6E6E73", background: "transparent", border: "none", cursor: "pointer" }}>
                {resetLoading ? "…" : t.auth_forgot}
              </button>
              <Link href="/auth/inscription" style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)", textDecoration: "none" }}>
                {t.auth_create_account}
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function ConnexionPage() {
  return <ConnexionInner />;
}
