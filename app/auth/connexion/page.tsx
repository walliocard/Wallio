"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function ConnexionInner() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(
    searchParams.get("inactive") ? "Votre compte est en attente d'activation par l'équipe Wallio." : ""
  );
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

  async function handleReset() {
    if (!form.email) { setError("Entre ton email d'abord."); return; }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, form.email);
      setResetSent(true);
      setError("");
    } catch {
      setError("Email introuvable.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 10000)
      );
      await Promise.race([
        signInWithEmailAndPassword(auth, form.email, form.password),
        timeout,
      ]);
      router.push("/dashboard");
    } catch (e: unknown) {
      // Purge l'état Firebase corrompu (IndexedDB Safari) avant d'afficher l'erreur
      try { await signOut(auth); } catch { /* déjà déconnecté */ }
      const msg = e instanceof Error ? e.message : "";
      if (msg === "timeout" || msg.includes("network") || msg.includes("unavailable")) {
        setError("Connexion lente — réessaie dans quelques secondes.");
      } else {
        setError("Email ou mot de passe incorrect.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>

      {/* Halo lumineux */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[600px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(0,122,255,0.15) 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-[380px] relative">

        {/* Logo */}
        <div className="text-center mb-12">
          <img src="/wallio-instagram-profil.png" alt="Wallio" style={{ width: 88, height: 88, borderRadius: 22, margin: "0 auto 16px", display: "block" }} />
          <p className="text-[15px] mt-1" style={{ color: "var(--fg-secondary)" }}>
            Espace marchand
          </p>
        </div>

        {/* Card */}
        <div className="rounded-[28px] p-8"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            backdropFilter: "blur(30px)",
            boxShadow: "var(--shadow-lg)",
          }}>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <input
                type="email"
                required
                placeholder="Email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all duration-200"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--fg)",
                }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
              <input
                type="password"
                required
                placeholder="Mot de passe"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all duration-200"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--fg)",
                }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            {error && (
              <p className="text-[13px] text-red-500 px-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white transition-all duration-200 mt-2"
              style={{ background: "var(--accent)", boxShadow: "0 4px 16px rgba(0,122,255,0.3)" }}
              onMouseEnter={e => { (e.target as HTMLElement).style.background = "var(--accent-hover)"; (e.target as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.background = "var(--accent)"; (e.target as HTMLElement).style.transform = "translateY(0)"; }}
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

        {resetSent && (
          <p className="text-center text-[13px] mt-4" style={{ color: "#34C759" }}>
            ✅ Email de réinitialisation envoyé.
          </p>
        )}

        <div className="flex items-center justify-between mt-5">
          <button onClick={handleReset} disabled={resetLoading}
            className="text-[13px]" style={{ color: "var(--fg-tertiary)" }}>
            {resetLoading ? "Envoi…" : "Mot de passe oublié ?"}
          </button>
          <Link href="/auth/inscription" className="text-[13px] font-medium" style={{ color: "var(--accent)" }}>
            Créer un compte
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ConnexionPage() {
  return <Suspense><ConnexionInner /></Suspense>;
}
