"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithCustomToken, signOut, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import WallioLogo from "@/components/WallioLogo";
import {
  isPasskeySupported,
  isPasskeyRegistered,
  registerPasskeyForGerant,
  registerPasskeyForMembre,
  authenticateGerantWithPasskey,
  authenticateMembreWithPasskey,
} from "@/lib/passkey-client";

function isPrivateMode(): boolean {
  try { const k = "__w__"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return false; } catch { return true; }
}

type EquipeStep = "code" | "prenom" | "pin";

function ConnexionInner() {
  const { t } = useLang();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"gerant" | "equipe">("gerant");
  const [equipeStep, setEquipeStep] = useState<EquipeStep>("code");
  const [equipeData, setEquipeData] = useState<{ marchandId: string; marchandNom: string; membres: { id: string; prenom: string }[] } | null>(null);

  useEffect(() => {
    if (searchParams.get("changer") !== "1") return;
    try {
      const stored = localStorage.getItem("equipe_etablissement");
      if (!stored) return;
      const data = JSON.parse(stored);
      setEquipeData(data);
      setMode("equipe");
      setEquipeStep("prenom");
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Gérant
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(
    searchParams.get("inactive") ? t.auth_inactive : ""
  );
  const [loading, setLoading] = useState(false);
  const [privateMode] = useState(() => typeof window !== "undefined" && isPrivateMode());
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Équipe
  const [code, setCode] = useState("");
  const [membreSelectionne, setMembreSelectionne] = useState<{ id: string; prenom: string } | null>(null);
  const [pin, setPin] = useState("");
  const [equipeError, setEquipeError] = useState("");
  const [equipeLoading, setEquipeLoading] = useState(false);

  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);
  const [gerantPasskeyBanner, setGerantPasskeyBanner] = useState<string | null>(null); // uid après login
  const [membrePasskeyBanner, setMembrePasskeyBanner] = useState<{ marchandId: string; membreId: string } | null>(null);
  const [membrePasskeyOk, setMembrePasskeyOk] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");

  const router = useRouter();

  useEffect(() => {
    isPasskeySupported().then(supported => {
      setPasskeySupported(supported);
      if (supported) {
        try {
          setPasskeyAvailable(localStorage.getItem("wallio_pk_gerant") === "1");
        } catch {}
      }
    });
  }, []);

  async function handleReset() {
    if (!form.email) { setError(t.auth_error_email); return; }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, form.email);
      setResetSent(true);
      setError("");
    } catch {
      setError(t.auth_error_not_found);
    } finally {
      setResetLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Purge le token Firebase périmé en localStorage
      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith("firebase:authUser:")) localStorage.removeItem(k);
        });
      } catch {}
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 15000)
      );
      const cred = await Promise.race([
        signInWithEmailAndPassword(auth, form.email, form.password),
        timeout,
      ]);
      const uid = cred.user.uid;
      const supported = await isPasskeySupported();
      if (supported) {
        const already = await isPasskeyRegistered(`gerant:${uid}`);
        if (!already) { setGerantPasskeyBanner(uid); return; }
      }
      router.push("/dashboard");
    } catch (e: unknown) {
      signOut(auth).catch(() => {});
      const msg = e instanceof Error ? e.message : "";
      if (msg === "timeout" || msg.includes("network") || msg.includes("unavailable")) {
        setError(t.auth_error_slow);
      } else {
        setError(t.auth_error_wrong);
      }
    } finally {
      setLoading(false);
    }
  }


  async function handleValiderCode(e: React.FormEvent) {
    e.preventDefault();
    setEquipeLoading(true); setEquipeError("");
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
      if (!result) { setPasskeyError("Authentification annulée ou échouée."); return; }
      await signInWithCustomToken(auth, result.customToken);
      router.push("/dashboard");
    } catch { setPasskeyError("Erreur Face ID. Utilisez email et mot de passe."); }
    finally { setPasskeyLoading(false); }
  }

  async function handleMembreFaceId() {
    if (!equipeData) return;
    setPasskeyLoading(true); setPasskeyError("");
    try {
      const result = await authenticateMembreWithPasskey();
      if (!result) { setPasskeyError("Authentification annulée ou échouée."); return; }
      localStorage.setItem("equipe_session", JSON.stringify({ token: result.token, prenom: result.prenom, marchandId: result.marchandId, marchandNom: result.marchandNom, logo_url: result.logo_url || null, permissions: result.permissions }));
      router.push("/equipe/scanner");
    } catch { setPasskeyError("Erreur Face ID. Utilisez votre PIN."); }
    finally { setPasskeyLoading(false); }
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
      if (membreSelectionne && equipeData) {
        const supported = await isPasskeySupported();
        if (supported) {
          const already = await isPasskeyRegistered(`membre:${equipeData.marchandId}:${membreSelectionne.id}`);
          if (!already) { setMembrePasskeyBanner({ marchandId: equipeData.marchandId, membreId: membreSelectionne.id }); return; }
        }
      }
      router.push("/equipe/scanner");
    } catch { setEquipeError("Erreur de connexion. Réessayez."); }
    finally { setEquipeLoading(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5" style={{ background: "#FFFFFF", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>

      {/* Gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[50%] translate-x-[-50%] w-[600px] h-[500px] rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, rgba(0,122,255,0.10) 0%, transparent 65%)" }} />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)" }} />
      </div>

      <div className="w-full max-w-[360px] relative">

        {/* Logo + titre */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <WallioLogo size={52} />
          </div>
          <h1 className="text-[26px] font-bold tracking-[-0.5px]" style={{ color: "#1D1D1F" }}>Wallio Pro</h1>
          <p className="text-[14px] mt-1" style={{ color: "#6E6E73" }}>Tableau de bord marchand</p>
        </div>

        <div className="rounded-[24px] overflow-hidden"
          style={{ background: "rgba(20,20,22,0.82)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>

          {/* Toggle Gérant / Équipe */}
          <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {(["gerant", "equipe"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); setEquipeError(""); setEquipeStep("code"); setCode(""); setPin(""); }}
                className="flex-1 py-3.5 text-[14px] font-semibold transition-all"
                style={{
                  color: mode === m ? "white" : "rgba(255,255,255,0.35)",
                  borderBottom: mode === m ? "2px solid var(--accent)" : "2px solid transparent",
                  background: "transparent",
                }}>
                {m === "gerant" ? "Gérant" : "Équipe"}
              </button>
            ))}
          </div>

          <div className="p-6">

          {/* ── Banner passkey gérant ── */}
          {gerantPasskeyBanner && (
            <div className="space-y-3 text-center">
              <p className="text-[17px] font-semibold" style={{ color: "var(--fg)" }}>Connexion rapide</p>
              <p className="text-[14px]" style={{ color: "var(--fg-secondary)" }}>
                Activer Face ID / Empreinte pour vous connecter sans mot de passe la prochaine fois ?
              </p>
              <button onClick={async () => { await registerPasskeyForGerant(gerantPasskeyBanner); try { localStorage.setItem("wallio_pk_gerant", "1"); } catch {} router.push("/dashboard"); }}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white"
                style={{ background: "var(--accent)" }}>
                Activer Face ID
              </button>
              <button onClick={() => router.push("/dashboard")} className="w-full text-[13px] py-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                Plus tard
              </button>
            </div>
          )}

          {/* ── Banner passkey membre ── */}
          {membrePasskeyBanner && (
            <div className="space-y-3 text-center">
              <p className="text-[17px] font-semibold" style={{ color: "var(--fg)" }}>Connexion rapide</p>
              <p className="text-[14px]" style={{ color: "var(--fg-secondary)" }}>
                Activer Face ID / Empreinte pour vous connecter sans PIN la prochaine fois ?
              </p>
              <button onClick={async () => { await registerPasskeyForMembre(membrePasskeyBanner.marchandId, membrePasskeyBanner.membreId); router.push("/equipe/scanner"); }}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white"
                style={{ background: "var(--accent)" }}>
                Activer Face ID
              </button>
              <button onClick={() => router.push("/equipe/scanner")} className="w-full text-[13px] py-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                Plus tard
              </button>
            </div>
          )}

          {/* ── Formulaire Gérant ── */}
          {!gerantPasskeyBanner && !membrePasskeyBanner && mode === "gerant" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {passkeyAvailable && (
                <div className="space-y-2">
                  <button type="button" onClick={handleGerantFaceId} disabled={passkeyLoading}
                    className="w-full py-3.5 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    {passkeyLoading ? "Vérification…" : "Face ID / Empreinte"}
                  </button>
                  {passkeyError && <p className="text-[12px] text-center text-red-500">{passkeyError}</p>}
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>ou</span>
                    <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <input type="email" required placeholder={t.auth_email} value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                  onFocus={e => e.target.style.borderColor = "rgba(0,122,255,0.7)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"} />
                <input type="password" required placeholder={t.auth_password} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                  onFocus={e => e.target.style.borderColor = "rgba(0,122,255,0.7)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
              {privateMode && (
                <p className="text-[12px] px-1 py-2 rounded-xl text-center" style={{ background: "rgba(255,159,10,0.1)", color: "#FF9F0A" }}>
                  Navigation privée détectée — la session ne sera pas mémorisée après fermeture.
                </p>
              )}
              {error && <p className="text-[13px] text-red-500 px-1">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white transition-all duration-200 mt-2"
                style={{ background: "var(--accent)", boxShadow: "0 4px 16px rgba(0,122,255,0.3)" }}>
                {loading ? t.auth_logging_in : t.auth_login}
              </button>
            </form>
          )}

          {/* ── Flow Équipe — Étape 1 : Code ── */}
          {!gerantPasskeyBanner && !membrePasskeyBanner && mode === "equipe" && equipeStep === "code" && (
            <form onSubmit={handleValiderCode} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-[17px] font-semibold" style={{ color: "var(--fg)" }}>Code de l&apos;établissement</p>
                <p className="text-[13px] mt-1" style={{ color: "var(--fg-secondary)" }}>Demandez-le à votre gérant</p>
              </div>
              <input
                type="text" required maxLength={6} placeholder="Ex : X7K3P2"
                value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                className="w-full px-4 py-4 rounded-2xl text-[22px] font-bold text-center tracking-[0.3em] outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                onFocus={e => e.target.style.borderColor = "rgba(0,122,255,0.7)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
              {equipeError && <p className="text-[13px] text-red-500 text-center">{equipeError}</p>}
              <button type="submit" disabled={equipeLoading || code.length !== 6}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white transition-all"
                style={{ background: code.length === 6 ? "var(--accent)" : "var(--border)", opacity: equipeLoading ? 0.7 : 1 }}>
                {equipeLoading ? "Vérification…" : "Continuer"}
              </button>
            </form>
          )}

          {/* ── Flow Équipe — Étape 2 : Choix prénom ── */}
          {!gerantPasskeyBanner && !membrePasskeyBanner && mode === "equipe" && equipeStep === "prenom" && equipeData && (
            <div>
              <div className="text-center mb-5">
                <p className="text-[17px] font-semibold" style={{ color: "var(--fg)" }}>{equipeData.marchandNom}</p>
                <p className="text-[13px] mt-1" style={{ color: "var(--fg-secondary)" }}>Qui êtes-vous ?</p>
              </div>
              <div className="space-y-2">
                {equipeData.membres.map(m => (
                  <button key={m.id} onClick={async () => {
                    setMembreSelectionne(m); setEquipeStep("pin"); setEquipeError("");
                    if (passkeySupported && equipeData) {
                      const ok = await isPasskeyRegistered(`membre:${equipeData.marchandId}:${m.id}`);
                      setMembrePasskeyOk(ok);
                    }
                  }}
                    className="w-full py-3.5 rounded-2xl text-[16px] font-semibold text-left px-5 transition-all active:opacity-75"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}>
                    {m.prenom}
                  </button>
                ))}
              </div>
              <button onClick={() => setEquipeStep("code")} className="w-full mt-4 text-[13px] text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                ← Changer de code
              </button>
            </div>
          )}

          {/* ── Flow Équipe — Étape 3 : PIN ── */}
          {!gerantPasskeyBanner && !membrePasskeyBanner && mode === "equipe" && equipeStep === "pin" && membreSelectionne && (
            <form onSubmit={handleAuthMembre} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-[17px] font-semibold" style={{ color: "var(--fg)" }}>Bonjour, {membreSelectionne.prenom}</p>
                <p className="text-[13px] mt-1" style={{ color: "var(--fg-secondary)" }}>Saisissez votre PIN</p>
              </div>
              {membrePasskeyOk && (
                <div className="space-y-2">
                  <button type="button" onClick={handleMembreFaceId} disabled={passkeyLoading}
                    className="w-full py-3.5 rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    {passkeyLoading ? "Vérification…" : "Face ID / Empreinte"}
                  </button>
                  {passkeyError && <p className="text-[12px] text-center text-red-500">{passkeyError}</p>}
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>ou</span>
                    <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  </div>
                </div>
              )}
              <input
                type="password" inputMode="numeric" maxLength={4} required placeholder="••••" autoComplete="one-time-code"
                value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full px-4 py-4 rounded-2xl text-[28px] font-bold text-center tracking-[0.5em] outline-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                onFocus={e => e.target.style.borderColor = "rgba(0,122,255,0.7)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
                autoFocus
              />
              {equipeError && <p className="text-[13px] text-red-500 text-center">{equipeError}</p>}
              <button type="submit" disabled={equipeLoading || pin.length !== 4}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white transition-all"
                style={{ background: pin.length === 4 ? "var(--accent)" : "var(--border)", opacity: equipeLoading ? 0.7 : 1 }}>
                {equipeLoading ? "Connexion…" : "Se connecter"}
              </button>
              <button type="button" onClick={() => { setEquipeStep("prenom"); setPin(""); setEquipeError(""); }}
                className="w-full text-[13px] text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
                ← Ce n&apos;est pas moi
              </button>
            </form>
          )}
          </div>{/* end p-6 */}
        </div>{/* end card */}

        {mode === "gerant" && (
          <>
            {resetSent && <p className="text-center text-[13px] mt-4" style={{ color: "#34C759" }}>{t.auth_reset_sent}</p>}
            <div className="flex items-center justify-between mt-5 px-1">
              <button onClick={handleReset} disabled={resetLoading} className="text-[13px]" style={{ color: "#6E6E73" }}>
                {resetLoading ? "…" : t.auth_forgot}
              </button>
              <Link href="/auth/inscription" className="text-[13px] font-medium" style={{ color: "var(--accent)" }}>
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
  return <Suspense><ConnexionInner /></Suspense>;
}
