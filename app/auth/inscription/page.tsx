"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveMarchandFields } from "@/lib/save-marchand";
import Link from "next/link";
import WallioIcon from "@/components/WallioIcon";

export default function InscriptionPage() {
  const [form, setForm] = useState({ nom: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await saveMarchandFields(user, {
        nom: form.nom,
        email: form.email,
        objectif_tampons: 10,
        nom_recompense: "Récompense offerte",
        icone_tampons: "⭐",
        couleur_principale: "#007AFF",
        couleur_secondaire: "#F5F5F7",
        anti_doublon_delai: 86400,
        fuseau_horaire: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) setError("Cet email est déjà utilisé.");
      else if (msg.includes("weak-password")) setError("Mot de passe trop court (6 caractères minimum).");
      else setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
            style={{ background: "rgba(0,122,255,0.1)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17L4 12" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-3" style={{ color: "var(--fg)" }}>Compte créé</h1>
          <p className="text-[15px] leading-relaxed" style={{ color: "var(--fg-secondary)" }}>
            Votre compte est en attente d&apos;activation par l&apos;équipe Wallio. Vous serez notifié sous 24h.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[600px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(0,122,255,0.12) 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-[380px] relative">

        <div className="text-center mb-12">
          <WallioIcon size={56} className="mb-5 mx-auto" />
          <h1 className="text-[28px] font-semibold tracking-[-0.5px]" style={{ color: "var(--fg)" }}>Wallio</h1>
          <p className="text-[15px] mt-1.5" style={{ color: "var(--fg-secondary)" }}>Créer votre espace marchand</p>
        </div>

        <div className="rounded-[28px] p-8"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            backdropFilter: "blur(30px)",
            boxShadow: "var(--shadow-lg)",
          }}>

          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { key: "nom", type: "text", placeholder: "Nom de l'établissement" },
              { key: "email", type: "email", placeholder: "Email" },
              { key: "password", type: "password", placeholder: "Mot de passe" },
            ].map(field => (
              <input
                key={field.key}
                type={field.type}
                required
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-all duration-200"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            ))}

            {error && <p className="text-[13px] text-red-500 px-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white transition-all duration-200 mt-1"
              style={{ background: "var(--accent)", boxShadow: "0 4px 16px rgba(0,122,255,0.3)" }}
              onMouseEnter={e => { (e.target as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.transform = "translateY(0)"; }}
            >
              {loading ? "Création…" : "Créer mon compte"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] mt-6" style={{ color: "var(--fg-tertiary)" }}>
          Déjà un compte ?{" "}
          <Link href="/auth/connexion" style={{ color: "var(--accent)" }} className="font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
