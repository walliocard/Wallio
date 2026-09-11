"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveMarchandFields } from "@/lib/save-marchand";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";

const VILLES: Record<string, string[]> = {
  Maroc: [
    "Agadir","Béni Mellal","Casablanca","El Jadida","Fès","Kénitra",
    "Khouribga","Laâyoune","Marrakech","Meknès","Mohammedia","Nador",
    "Oujda","Rabat","Safi","Salé","Settat","Tanger","Tétouan",
  ],
  Roumanie: ["Cluj-Napoca"],
};

const inputStyle: React.CSSProperties = {
  background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)",
  width: "100%", padding: "14px 16px", borderRadius: 16, fontSize: 15, outline: "none",
  transition: "border-color 0.2s",
};

export default function InscriptionPage() {
  const [form, setForm] = useState({ nom: "", email: "", password: "", telephone: "", pays: "Maroc", ville: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const villes = VILLES[form.pays] ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ville) { setError("Veuillez sélectionner une ville."); return; }
    setError("");
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);

      // Firestore + notif admin en background — le serveur Vercel termine même si le client quitte
      saveMarchandFields(user, {
        nom: form.nom,
        email: form.email,
        telephone: form.telephone || null,
        ville: form.ville,
        pays: form.pays,
        objectif_tampons: 10,
        nom_recompense: "Récompense offerte",
        icone_tampons: "⭐",
        couleur_principale: "#007AFF",
        couleur_secondaire: "#F5F5F7",
        anti_doublon_delai: 86400,
        fuseau_horaire: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }).catch(() => {});

      fetch("/api/notify-admin-inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: form.nom, email: form.email, ville: form.ville }),
      }).catch(() => {});

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

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

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
    <main className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: "var(--bg)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[800px] h-[600px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(0,122,255,0.12) 0%, transparent 70%)" }} />
      </div>

      <div className="w-full max-w-[380px] relative">
        <div className="text-center mb-10">
          <img src="/wallio-instagram-profil.png" alt="Wallio"
            style={{ width: 80, height: 80, borderRadius: 20, margin: "0 auto 14px", display: "block" }} />
          <p className="text-[15px]" style={{ color: "var(--fg-secondary)" }}>Créer votre espace marchand</p>
        </div>

        <div className="rounded-[28px] p-7"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(30px)", boxShadow: "var(--shadow-lg)" }}>

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Nom */}
            <input type="text" required placeholder="Nom de l'établissement"
              value={form.nom} onChange={e => set("nom", e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "var(--accent)"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"} />

            {/* Email */}
            <input type="email" required placeholder="Email"
              value={form.email} onChange={e => set("email", e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "var(--accent)"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"} />

            {/* Mot de passe */}
            <input type="password" required placeholder="Mot de passe (min. 6 caractères)"
              value={form.password} onChange={e => set("password", e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "var(--accent)"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"} />

            {/* Téléphone (optionnel) */}
            <input type="tel" placeholder="Téléphone (optionnel)"
              value={form.telephone} onChange={e => set("telephone", e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "var(--accent)"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"} />

            {/* Séparateur localisation */}
            <p style={{ fontSize: 12, color: "var(--fg-tertiary)", paddingTop: 2, paddingLeft: 2 }}>Localisation</p>

            {/* Pays */}
            <select value={form.pays} onChange={e => { set("pays", e.target.value); set("ville", ""); }}
              style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
              {Object.keys(VILLES).map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Ville */}
            <select required value={form.ville} onChange={e => set("ville", e.target.value)}
              style={{ ...inputStyle, appearance: "none", cursor: "pointer", color: form.ville ? "var(--fg)" : "var(--fg-tertiary)" }}>
              <option value="" disabled>Sélectionner une ville</option>
              {villes.map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            {error && <p className="text-[13px] text-red-500 px-1">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white transition-all duration-200 mt-1"
              style={{ background: "var(--accent)", boxShadow: "0 4px 16px rgba(0,122,255,0.3)" }}>
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
