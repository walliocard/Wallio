"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";

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
      await setDoc(doc(db, "marchands", user.uid), {
        nom: form.nom,
        email: form.email,
        actif: false,
        date_inscription: serverTimestamp(),
        objectif_tampons: 10,
        nom_recompense: "Récompense offerte",
        mode_recompense: "cyclique",
        icone_tampons: "⭐",
        couleur_principale: "#00F5A0",
        couleur_secondaire: "#0A0A0A",
        anti_doublon_delai: 86400,
        fuseau_horaire: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue";
      if (msg.includes("email-already-in-use")) setError("Cet email est déjà utilisé.");
      else if (msg.includes("weak-password")) setError("Mot de passe trop court (6 caractères minimum).");
      else setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-6">✅</div>
          <h1 className="text-2xl font-semibold mb-3">Compte créé !</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Votre compte est en attente d&apos;activation par l&apos;équipe Wallio.
            Vous recevrez une confirmation sous 24h.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Wallio</h1>
          <p className="text-white/40 text-sm mt-2">Créer votre espace marchand</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Nom de l&apos;établissement</label>
            <input
              type="text"
              required
              placeholder="Café Atlas"
              value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00F5A0]/60 transition placeholder:text-white/20"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Email</label>
            <input
              type="email"
              required
              placeholder="contact@cafeatlas.ma"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00F5A0]/60 transition placeholder:text-white/20"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Mot de passe</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#00F5A0]/60 transition placeholder:text-white/20"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00F5A0] text-black font-semibold rounded-xl py-3 text-sm mt-2 hover:bg-[#00F5A0]/90 transition disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs mt-8">
          Déjà un compte ?{" "}
          <Link href="/auth/connexion" className="text-[#00F5A0] hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
