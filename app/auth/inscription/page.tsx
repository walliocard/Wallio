"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { saveMarchandFields } from "@/lib/save-marchand";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";

const VILLES: Record<string, string[]> = {
  Maroc: [
    "Agadir","Béni Mellal","Casablanca","El Jadida","Fès","Kénitra",
    "Khouribga","Laâyoune","Marrakech","Meknès","Mohammedia","Nador",
    "Oujda","Rabat","Safi","Salé","Settat","Tanger","Tétouan",
  ],
  Roumanie: ["Cluj-Napoca","București","Brașov","Timișoara","Iași","Constanța","Craiova","Galați","Ploiești","Sibiu"],
  France: ["Paris","Lyon","Marseille","Bordeaux","Lille","Nantes","Toulouse","Strasbourg","Nice","Montpellier"],
};

const inputStyle: React.CSSProperties = {
  background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)",
  width: "100%", padding: "14px 16px", borderRadius: 16, fontSize: 15, outline: "none",
  transition: "border-color 0.2s",
};

export default function InscriptionPage() {
  const { t } = useLang();
  const [form, setForm] = useState({ nom: "", email: "", password: "", telephone: "", pays: "Maroc", ville: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const villes = VILLES[form.pays] ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ville) { setError(t.auth_inscription_error_city); return; }
    setError("");
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);

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
      if (msg.includes("email-already-in-use")) setError(t.auth_inscription_error_email);
      else if (msg.includes("weak-password")) setError(t.auth_inscription_error_password);
      else setError(t.auth_inscription_error_generic);
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
          <h1 className="text-2xl font-semibold tracking-tight mb-3" style={{ color: "var(--fg)" }}>{t.auth_inscription_success_title}</h1>
          <p className="text-[15px] leading-relaxed" style={{ color: "var(--fg-secondary)" }}>
            {t.auth_inscription_success_body}
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
          <p className="text-[15px]" style={{ color: "var(--fg-secondary)" }}>{t.auth_inscription_title}</p>
        </div>

        <div className="rounded-[28px] p-7"
          style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)", backdropFilter: "blur(30px)", boxShadow: "var(--shadow-lg)" }}>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" required placeholder={t.auth_inscription_name}
              value={form.nom} onChange={e => set("nom", e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "var(--accent)"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"} />

            <input type="email" required placeholder={t.auth_inscription_email}
              value={form.email} onChange={e => set("email", e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "var(--accent)"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"} />

            <input type="password" required placeholder={t.auth_inscription_password}
              value={form.password} onChange={e => set("password", e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "var(--accent)"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"} />

            <input type="tel" placeholder={t.auth_inscription_phone}
              value={form.telephone} onChange={e => set("telephone", e.target.value)}
              style={inputStyle}
              onFocus={e => (e.target as HTMLInputElement).style.borderColor = "var(--accent)"}
              onBlur={e => (e.target as HTMLInputElement).style.borderColor = "var(--border)"} />

            <p style={{ fontSize: 12, color: "var(--fg-tertiary)", paddingTop: 2, paddingLeft: 2 }}>Localisation</p>

            <select value={form.pays} onChange={e => { set("pays", e.target.value); set("ville", ""); }}
              style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
              {Object.keys(VILLES).map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select required value={form.ville} onChange={e => set("ville", e.target.value)}
              style={{ ...inputStyle, appearance: "none", cursor: "pointer", color: form.ville ? "var(--fg)" : "var(--fg-tertiary)" }}>
              <option value="" disabled>{t.auth_inscription_select_city}</option>
              {villes.map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            {error && <p className="text-[13px] text-red-500 px-1">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white transition-all duration-200 mt-1"
              style={{ background: "var(--accent)", boxShadow: "0 4px 16px rgba(0,122,255,0.3)" }}>
              {loading ? t.auth_inscription_creating : t.auth_inscription_submit}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] mt-6" style={{ color: "var(--fg-tertiary)" }}>
          {t.auth_already_account}{" "}
          <Link href="/auth/connexion" style={{ color: "var(--accent)" }} className="font-medium">
            {t.auth_login_link}
          </Link>
        </p>
      </div>
    </main>
  );
}
