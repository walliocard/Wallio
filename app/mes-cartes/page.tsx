"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CardData {
  walletId: string;
  marchandId: string;
  marchandNom: string;
  logoUrl?: string;
  couleur: string;
  stampsCurrent: number;
  stampsObjective: number;
  rewardName: string;
  hasPushToken: boolean;
}

const PHONE_KEY = "wallio_client_phone";
const PAYS = [
  { code: "+212", flag: "🇲🇦", label: "Maroc" },
  { code: "+213", flag: "🇩🇿", label: "Algérie" },
  { code: "+216", flag: "🇹🇳", label: "Tunisie" },
  { code: "+33",  flag: "🇫🇷", label: "France" },
  { code: "+32",  flag: "🇧🇪", label: "Belgique" },
  { code: "+34",  flag: "🇪🇸", label: "Espagne" },
  { code: "+39",  flag: "🇮🇹", label: "Italie" },
  { code: "+41",  flag: "🇨🇭", label: "Suisse" },
  { code: "+44",  flag: "🇬🇧", label: "Royaume-Uni" },
  { code: "+49",  flag: "🇩🇪", label: "Allemagne" },
  { code: "+31",  flag: "🇳🇱", label: "Pays-Bas" },
  { code: "+351", flag: "🇵🇹", label: "Portugal" },
  { code: "+90",  flag: "🇹🇷", label: "Turquie" },
  { code: "+971", flag: "🇦🇪", label: "Émirats" },
  { code: "+966", flag: "🇸🇦", label: "Arabie S." },
  { code: "+974", flag: "🇶🇦", label: "Qatar" },
  { code: "+965", flag: "🇰🇼", label: "Koweït" },
  { code: "+221", flag: "🇸🇳", label: "Sénégal" },
  { code: "+225", flag: "🇨🇮", label: "Côte d'Ivoire" },
  { code: "+1",   flag: "🇺🇸", label: "USA/CA" },
];

export default function MesCartesPage() {
  const [step, setStep] = useState<"loading" | "login" | "cards">("loading");
  const [countryCode, setCountryCode] = useState("+212");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [cards, setCards] = useState<CardData[]>([]);
  const [fetching, setFetching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [prenom, setPrenom] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(PHONE_KEY);
    if (saved) {
      setPhone(saved);
      loadCards(saved);
    } else {
      setStep("login");
    }
  }, []);

  async function loadCards(fullPhone: string) {
    setFetching(true);
    setNotFound(false);
    try {
      const snap = await getDocs(
        query(collection(db, "clients"), where("telephone", "==", fullPhone))
      );
      if (snap.empty) { setNotFound(true); setStep("login"); setFetching(false); return; }

      const results: CardData[] = [];
      let nom = "";
      await Promise.all(snap.docs.map(async (clientDoc) => {
        const client = clientDoc.data();
        if (!nom && client.prenom) nom = client.prenom;
        try {
          const marchandSnap = await getDoc(doc(db, "marchands", client.marchand_id));
          if (!marchandSnap.exists()) return;
          const m = marchandSnap.data();
          results.push({
            walletId: client.wallet_id,
            marchandId: client.marchand_id,
            marchandNom: m.nom || "Établissement",
            logoUrl: m.logo_url || undefined,
            couleur: m.apple_bg_color || m.couleur_principale || "#1C1C1E",
            stampsCurrent: client.tampons || 0,
            stampsObjective: m.objectif_tampons || 10,
            rewardName: m.nom_recompense || "Récompense",
            hasPushToken: !!client.apns_push_token,
          });
        } catch { /* marchand introuvable */ }
      }));

      setPrenom(nom);
      setCards(results);
      setStep("cards");
    } catch {
      setNotFound(true);
      setStep("login");
    }
    setFetching(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // Normalisation identique à la page NFC
    const local = phoneInput.replace(/\D/g, "").replace(/^0/, "");
    if (!local) return;
    const full = `${countryCode}${local}`;
    setPhone(full);
    localStorage.setItem(PHONE_KEY, full);
    await loadCards(full);
  }

  function handleLogout() {
    localStorage.removeItem(PHONE_KEY);
    setPhone("");
    setCards([]);
    setPrenom("");
    setPhoneInput("");
    setNotFound(false);
    setStep("login");
  }

  // ── Loading ──────────────────────────────────────────────────────────
  if (step === "loading" || fetching) {
    return (
      <main style={pageStyle}>
        <Logo />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid #007AFF", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  // ── Login ────────────────────────────────────────────────────────────
  if (step === "login") {
    return (
      <main style={pageStyle}>
        <Logo />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px 48px" }}>
          <div style={{ maxWidth: 380, width: "100%", margin: "0 auto" }}>

            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: "#1D1D1F", marginBottom: 6 }}>
              Mes cartes
            </h1>
            <p style={{ fontSize: 14, color: "#6E6E73", marginBottom: 32, lineHeight: 1.5 }}>
              Entrez votre numéro pour retrouver toutes vos cartes de fidélité.
            </p>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Phone input */}
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  style={{
                    padding: "14px 10px", borderRadius: 16, fontSize: 14, fontWeight: 500,
                    border: "1.5px solid rgba(0,0,0,0.1)", background: "white",
                    color: "#1D1D1F", outline: "none", cursor: "pointer", flexShrink: 0,
                  }}
                >
                  {PAYS.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  placeholder="6 12 34 56 78"
                  required
                  style={{
                    flex: 1, padding: "14px 16px", borderRadius: 16, fontSize: 16,
                    border: "1.5px solid rgba(0,0,0,0.1)", background: "white",
                    color: "#1D1D1F", outline: "none",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#007AFF")}
                  onBlur={e => (e.target.style.borderColor = "rgba(0,0,0,0.1)")}
                />
              </div>

              {notFound && (
                <p style={{ fontSize: 13, color: "#FF3B30", textAlign: "center" }}>
                  Aucune carte trouvée pour ce numéro.
                </p>
              )}

              <button
                type="submit"
                disabled={fetching || !phoneInput.trim()}
                style={{
                  width: "100%", padding: "15px", borderRadius: 16,
                  background: phoneInput.trim() ? "#007AFF" : "rgba(0,0,0,0.08)",
                  color: phoneInput.trim() ? "white" : "#8E8E93",
                  fontSize: 15, fontWeight: 600, border: "none", cursor: phoneInput.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                }}
              >
                {fetching ? "Recherche…" : "Voir mes cartes"}
              </button>
            </form>

          </div>
        </div>
      </main>
    );
  }

  // ── Cards ────────────────────────────────────────────────────────────
  return (
    <main style={{ ...pageStyle, justifyContent: "flex-start" }}>
      {/* Header */}
      <div style={{ padding: "52px 20px 16px", maxWidth: 430, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "#007AFF", marginBottom: 2 }}>Wallio</p>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: "#1D1D1F" }}>
              {prenom ? `Bonjour, ${prenom} !` : "Mes cartes"}
            </h1>
            <p style={{ fontSize: 13, color: "#8E8E93", marginTop: 2 }}>
              {cards.length} carte{cards.length > 1 ? "s" : ""} · {phone}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 12, padding: "8px 14px", fontSize: 13, color: "#6E6E73", cursor: "pointer", fontWeight: 500 }}
          >
            Changer
          </button>
        </div>
      </div>

      {/* Cards list */}
      <div style={{ padding: "8px 20px 48px", maxWidth: 430, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
        {cards.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <p style={{ fontSize: 15, color: "#8E8E93" }}>Aucune carte active.</p>
          </div>
        ) : cards.map((card) => {
          const pct = Math.min(100, Math.round((card.stampsCurrent / card.stampsObjective) * 100));
          const restants = card.stampsObjective - card.stampsCurrent;
          const dark = isColorDark(card.couleur);

          return (
            <div key={card.walletId} style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
              {/* Top */}
              <div style={{ background: card.couleur, padding: "20px 20px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {card.logoUrl ? (
                      <img src={card.logoUrl} alt="" style={{ height: 30, width: 30, borderRadius: 8, objectFit: "contain", background: "rgba(255,255,255,0.15)" }} />
                    ) : (
                      <div style={{ height: 30, width: 30, borderRadius: 8, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: dark ? "white" : "#1D1D1F" }}>{card.marchandNom[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 600, color: dark ? "white" : "#1D1D1F" }}>{card.marchandNom}</span>
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 700, color: dark ? "white" : "#1D1D1F" }}>
                    {card.stampsCurrent}<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.6 }}>/{card.stampsObjective}</span>
                  </span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.2)", borderRadius: 10 }}>
                  <div style={{ height: "100%", borderRadius: 10, background: dark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.5)", width: `${pct}%`, transition: "width 0.6s cubic-bezier(.16,1,.3,1)" }} />
                </div>
                <p style={{ fontSize: 12, color: dark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.45)", marginTop: 8 }}>
                  {restants > 0 ? `${restants} tampon${restants > 1 ? "s" : ""} avant : ${card.rewardName}` : `Récompense disponible : ${card.rewardName} !`}
                </p>
              </div>

              {/* Bottom */}
              <div style={{ background: "white", padding: "14px 20px" }}>
                {!card.hasPushToken && (
                  <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(255,149,0,0.08)", border: "1px solid rgba(255,149,0,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style={{ fontSize: 11, color: "#FF9500", fontWeight: 500 }}>Re-téléchargez pour activer les mises à jour auto</span>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <a href={`/api/apple-wallet/generate/${card.walletId}`} style={{ display: "flex", alignItems: "center", gap: 8, background: "#000", borderRadius: 12, padding: "9px 16px", textDecoration: "none" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="7" cy="14.5" r="1.5" fill="white" stroke="none"/></svg>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "white" }}>{card.hasPushToken ? "Apple Wallet" : "Mettre à jour"}</span>
                  </a>
                  <span style={{ fontSize: 12, color: "#8E8E93" }}>{pct === 100 ? "Récompense prête !" : `${pct}% complété`}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "#C7C7CC", paddingBottom: 32 }}>Wallio · cartes de fidélité digitales</p>
    </main>
  );
}

function Logo() {
  return (
    <div style={{ padding: "52px 24px 0", maxWidth: 430, width: "100%", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/icon.svg" alt="Wallio" style={{ width: 36, height: 36, borderRadius: 10 }} />
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3, color: "#1D1D1F" }}>Wallio</span>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#F0F4FF",
  fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
  WebkitFontSmoothing: "antialiased",
  display: "flex",
  flexDirection: "column",
};

function isColorDark(hex: string): boolean {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#1C1C1E";
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) < 0.35;
}
