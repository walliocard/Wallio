"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PHONE_KEY  = "wallio_client_phone";
const PRENOM_KEY = "wallio_client_prenom";
const NOM_KEY    = "wallio_client_nom";
const DOB_KEY    = "wallio_client_dob";

const PAYS = [
  { code: "+212", flag: "🇲🇦", label: "Maroc" },
  { code: "+213", flag: "🇩🇿", label: "Algérie" },
  { code: "+216", flag: "🇹🇳", label: "Tunisie" },
  { code: "+33",  flag: "🇫🇷", label: "France" },
  { code: "+32",  flag: "🇧🇪", label: "Belgique" },
  { code: "+34",  flag: "🇪🇸", label: "Espagne" },
  { code: "+41",  flag: "🇨🇭", label: "Suisse" },
  { code: "+44",  flag: "🇬🇧", label: "Royaume-Uni" },
  { code: "+49",  flag: "🇩🇪", label: "Allemagne" },
  { code: "+971", flag: "🇦🇪", label: "Émirats" },
  { code: "+966", flag: "🇸🇦", label: "Arabie S." },
  { code: "+1",   flag: "🇺🇸", label: "USA/CA" },
];

export default function InscriptionClientPage() {
  const router = useRouter();
  const [form, setForm] = useState({ prenom: "", nom: "", phone: "", dob: "" });
  const [countryCode, setCountryCode] = useState("+212");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const local = form.phone.replace(/\D/g, "").replace(/^0/, "");
    if (!local || !form.prenom) return;
    const fullPhone = `${countryCode}${local}`;
    localStorage.setItem(PHONE_KEY,  fullPhone);
    localStorage.setItem(PRENOM_KEY, form.prenom.trim());
    localStorage.setItem(NOM_KEY,    form.nom.trim());
    if (form.dob) localStorage.setItem(DOB_KEY, form.dob);
    router.push("/mes-cartes");
  }

  const ready = form.prenom.trim() && form.phone.trim();

  return (
    <main style={bg}>
      <div style={{ padding: "20px 20px 0", maxWidth: 430, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <img src="/wallio-instagram-profil.png" alt="Wallio" style={{ width: 38, height: 38, borderRadius: 10 }} />
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px 48px" }}>
        <div style={{ maxWidth: 390, width: "100%", margin: "0 auto" }}>
          <div style={{ ...glass, padding: "32px 28px", borderRadius: 28, marginBottom: 16 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: "#1C2333", marginBottom: 8 }}>Créer mon compte</h1>
            <p style={{ fontSize: 14, color: "#8E9BB5", marginBottom: 28, lineHeight: 1.55 }}>
              Rejoignez Wallio et découvrez les établissements près de chez vous.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="text" placeholder="Prénom *" required value={form.prenom}
                  onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                  style={{ ...input, flex: 1 }}
                  onFocus={e => (e.target.style.borderColor = "#5B7CFA")}
                  onBlur={e => (e.target.style.borderColor = "rgba(142,155,181,0.25)")}
                />
                <input
                  type="text" placeholder="Nom" value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  style={{ ...input, flex: 1 }}
                  onFocus={e => (e.target.style.borderColor = "#5B7CFA")}
                  onBlur={e => (e.target.style.borderColor = "rgba(142,155,181,0.25)")}
                />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                  style={{ ...input, flexShrink: 0, width: 90, paddingLeft: 10, paddingRight: 10 }}>
                  {PAYS.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <input
                  type="tel" inputMode="tel" placeholder="6 12 34 56 78 *" required value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  style={{ ...input, flex: 1 }}
                  onFocus={e => (e.target.style.borderColor = "#5B7CFA")}
                  onBlur={e => (e.target.style.borderColor = "rgba(142,155,181,0.25)")}
                />
              </div>

              <input
                type="date" placeholder="Date de naissance" value={form.dob}
                onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                style={{ ...input }}
                onFocus={e => (e.target.style.borderColor = "#5B7CFA")}
                onBlur={e => (e.target.style.borderColor = "rgba(142,155,181,0.25)")}
              />

              <button type="submit" disabled={!ready} style={{
                marginTop: 4, padding: "15px", borderRadius: 16, border: "none",
                cursor: ready ? "pointer" : "not-allowed",
                background: ready ? "linear-gradient(135deg,#5B7CFA,#7C5BFA)" : "rgba(142,155,181,0.15)",
                color: ready ? "white" : "#8E9BB5",
                fontSize: 15, fontWeight: 600,
                boxShadow: ready ? "0 8px 24px rgba(91,124,250,0.35)" : "none",
                transition: "all 0.2s",
              }}>
                Créer mon compte
              </button>
            </form>
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#8E9BB5" }}>
              Déjà un compte ?{" "}
              <a href="/mes-cartes" style={{ color: "#5B7CFA", fontWeight: 600, textDecoration: "none" }}>Voir mes cartes</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

const bg: React.CSSProperties = {
  minHeight: "100dvh",
  background: "linear-gradient(160deg,#EEF2FF 0%,#E8ECF8 50%,#F0EEF8 100%)",
  fontFamily: "-apple-system,'SF Pro Display',sans-serif",
  WebkitFontSmoothing: "antialiased",
  display: "flex", flexDirection: "column",
  paddingTop: "env(safe-area-inset-top)",
  paddingBottom: "env(safe-area-inset-bottom)",
} as React.CSSProperties;

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 8px 32px rgba(100,120,160,0.10)",
};

const input: React.CSSProperties = {
  padding: "14px 16px", borderRadius: 14, fontSize: 16, outline: "none",
  background: "rgba(142,155,181,0.1)", border: "1.5px solid rgba(142,155,181,0.25)",
  color: "#1C2333", transition: "border-color 0.2s", width: "100%", boxSizing: "border-box" as const,
};
