"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";

function isPrivateMode(): boolean {
  try { const k = "__w__"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return false; } catch { return true; }
}

type EquipeStep = "code" | "prenom" | "pin";

function ConnexionInner() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"gerant" | "equipe">("gerant");

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
  const [equipeStep, setEquipeStep] = useState<EquipeStep>("code");
  const [code, setCode] = useState("");
  const [equipeData, setEquipeData] = useState<{ marchandId: string; marchandNom: string; membres: { id: string; prenom: string }[] } | null>(null);
  const [membreSelectionne, setMembreSelectionne] = useState<{ id: string; prenom: string } | null>(null);
  const [pin, setPin] = useState("");
  const [equipeError, setEquipeError] = useState("");
  const [equipeLoading, setEquipeLoading] = useState(false);

  const router = useRouter();

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
      await Promise.race([
        signInWithEmailAndPassword(auth, form.email, form.password),
        timeout,
      ]);
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
      setEquipeStep("prenom");
    } catch { setEquipeError("Erreur de connexion. Réessayez."); }
    finally { setEquipeLoading(false); }
  }

  async function handleAuthMembre(e: React.FormEvent) {
    e.preventDefault();
    if (!equipeData || !membreSelectionne) return;
    setEquipeLoading(true); setEquipeError("");
    try {
      const res = await fetch("/api/equipe/auth-membre", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marchandId: equipeData.marchandId, membreId: membreSelectionne.id, pin }) });
      const data = await res.json();
      if (!res.ok) { setEquipeError(data.error || "PIN incorrect"); return; }
      localStorage.setItem("equipe_session", JSON.stringify({ token: data.token, prenom: data.prenom, marchandId: data.marchandId, marchandNom: data.marchandNom, permissions: data.permissions }));
      router.push("/equipe/scanner");
    } catch { setEquipeError("Erreur de connexion. Réessayez."); }
    finally { setEquipeLoading(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[600px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(0,122,255,0.15) 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-[380px] relative">

        <div className="text-center mb-10">
          <img src="/wallio-instagram-profil.png" alt="Wallio" style={{ width: 88, height: 88, borderRadius: 22, margin: "0 auto 16px", display: "block" }} />
        </div>

        {/* Toggle Gérant / Équipe */}
        <div className="flex rounded-2xl p-1 mb-6" style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
          {(["gerant", "equipe"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); setEquipeError(""); setEquipeStep("code"); setCode(""); setPin(""); }}
              className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold transition-all"
              style={{ background: mode === m ? "var(--accent)" : "transparent", color: mode === m ? "white" : "var(--fg-secondary)" }}>
              {m === "gerant" ? "Gérant" : "Équipe"}
            </button>
          ))}
        </div>

        <div className="rounded-[28px] p-8"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(30px)", boxShadow: "var(--shadow-lg)" }}>

          {/* ── Formulaire Gérant ── */}
          {mode === "gerant" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <input type="email" required placeholder={t.auth_email} value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all duration-200"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                  onFocus={e => e.target.style.borderColor = "var(--accent)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"} />
                <input type="password" required placeholder={t.auth_password} value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all duration-200"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                  onFocus={e => e.target.style.borderColor = "var(--accent)"}
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
          {mode === "equipe" && equipeStep === "code" && (
            <form onSubmit={handleValiderCode} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-[17px] font-semibold" style={{ color: "var(--fg)" }}>Code de l&apos;établissement</p>
                <p className="text-[13px] mt-1" style={{ color: "var(--fg-secondary)" }}>Demandez-le à votre gérant</p>
              </div>
              <input
                type="text" required maxLength={6} placeholder="Ex : X7K3P2"
                value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                className="w-full px-4 py-4 rounded-2xl text-[22px] font-bold text-center tracking-[0.3em] outline-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
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
          {mode === "equipe" && equipeStep === "prenom" && equipeData && (
            <div>
              <div className="text-center mb-5">
                <p className="text-[17px] font-semibold" style={{ color: "var(--fg)" }}>{equipeData.marchandNom}</p>
                <p className="text-[13px] mt-1" style={{ color: "var(--fg-secondary)" }}>Qui êtes-vous ?</p>
              </div>
              <div className="space-y-2">
                {equipeData.membres.map(m => (
                  <button key={m.id} onClick={() => { setMembreSelectionne(m); setEquipeStep("pin"); setEquipeError(""); }}
                    className="w-full py-3.5 rounded-2xl text-[16px] font-semibold text-left px-5 transition-all active:opacity-75"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}>
                    {m.prenom}
                  </button>
                ))}
              </div>
              <button onClick={() => setEquipeStep("code")} className="w-full mt-4 text-[13px] text-center" style={{ color: "var(--fg-tertiary)" }}>
                ← Changer de code
              </button>
            </div>
          )}

          {/* ── Flow Équipe — Étape 3 : PIN ── */}
          {mode === "equipe" && equipeStep === "pin" && membreSelectionne && (
            <form onSubmit={handleAuthMembre} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-[17px] font-semibold" style={{ color: "var(--fg)" }}>Bonjour, {membreSelectionne.prenom}</p>
                <p className="text-[13px] mt-1" style={{ color: "var(--fg-secondary)" }}>Saisissez votre PIN</p>
              </div>
              <input
                type="password" inputMode="numeric" maxLength={4} required placeholder="••••"
                value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full px-4 py-4 rounded-2xl text-[28px] font-bold text-center tracking-[0.5em] outline-none"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
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
                className="w-full text-[13px] text-center" style={{ color: "var(--fg-tertiary)" }}>
                ← Ce n&apos;est pas moi
              </button>
            </form>
          )}
        </div>

        {mode === "gerant" && (
          <>
            {resetSent && <p className="text-center text-[13px] mt-4" style={{ color: "#34C759" }}>✅ {t.auth_reset_sent}</p>}
            <div className="flex items-center justify-between mt-5">
              <button onClick={handleReset} disabled={resetLoading} className="text-[13px]" style={{ color: "var(--fg-tertiary)" }}>
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
