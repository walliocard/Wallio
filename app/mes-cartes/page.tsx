"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { creerClient } from "@/lib/loyalty";
import WallioIcon from "@/components/WallioIcon";

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

interface MarchandDiscover {
  id: string;
  nom: string;
  logoUrl?: string;
  couleur: string;
  nfc_id?: string;
}

const PHONE_KEY   = "wallio_client_phone";
const PRENOM_KEY  = "wallio_client_prenom";
const NOM_KEY     = "wallio_client_nom";
const DOB_KEY     = "wallio_client_dob";

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

export default function MesCartesPage() {
  const [step, setStep]         = useState<"loading"|"login"|"main">("loading");
  const [tab, setTab]           = useState<"cartes"|"decouvrir">("cartes");
  const [countryCode, setCountryCode] = useState("+212");
  const [phoneInput, setPhoneInput]   = useState("");
  const [phone, setPhone]       = useState("");
  const [prenom, setPrenom]     = useState("");
  const [nom, setNom]           = useState("");
  const [dob, setDob]           = useState("");
  const [cards, setCards]       = useState<CardData[]>([]);
  const [merchants, setMerchants] = useState<MarchandDiscover[]>([]);
  const [fetching, setFetching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining]   = useState<Set<string>>(new Set());
  const [joined, setJoined]     = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem(PHONE_KEY);
    if (saved) { setPhone(saved); loadCards(saved); }
    else setStep("login");
  }, []);

  async function loadCards(fullPhone: string) {
    setFetching(true); setNotFound(false);
    try {
      const snap = await getDocs(query(collection(db, "clients"), where("telephone", "==", fullPhone)));
      if (snap.empty) { setNotFound(true); setStep("login"); setFetching(false); return; }
      const results: CardData[] = [];
      let p = "", n = "", d = "";
      await Promise.all(snap.docs.map(async (clientDoc) => {
        const client = clientDoc.data();
        if (!p && client.prenom) { p = client.prenom; n = client.nom || ""; d = client.date_naissance || ""; }
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
        } catch { /* skip */ }
      }));
      setPrenom(p); setNom(n); setDob(d);
      if (p) { localStorage.setItem(PRENOM_KEY, p); localStorage.setItem(NOM_KEY, n); if (d) localStorage.setItem(DOB_KEY, d); }
      setCards(results);
      setStep("main");
      loadMerchants(results.map(c => c.marchandId));
    } catch { setNotFound(true); setStep("login"); }
    setFetching(false);
  }

  async function loadMerchants(registeredIds: string[]) {
    try {
      const snap = await getDocs(query(collection(db, "marchands"), where("actif", "==", true)));
      const list: MarchandDiscover[] = snap.docs
        .filter(d => !registeredIds.includes(d.id))
        .map(d => {
          const m = d.data();
          return { id: d.id, nom: m.nom || "Établissement", logoUrl: m.logo_url || undefined, couleur: m.apple_bg_color || m.couleur_principale || "#1C1C1E", nfc_id: m.nfc_id };
        });
      setMerchants(list);
    } catch { /* silent */ }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const local = phoneInput.replace(/\D/g, "").replace(/^0/, "");
    if (!local) return;
    const full = `${countryCode}${local}`;
    setPhone(full); localStorage.setItem(PHONE_KEY, full);
    await loadCards(full);
  }

  async function rejoindre(marchand: MarchandDiscover) {
    if (!phone || !prenom) return;
    setJoining(prev => new Set(prev).add(marchand.id));
    try {
      const { clientId, walletId } = await creerClient({
        prenom, nom, telephone: phone,
        date_naissance: dob || "",
        marchand_id: marchand.id,
      });
      void clientId;
      localStorage.setItem(`wallio_${marchand.id}`, walletId);
      const marchandSnap = await getDoc(doc(db, "marchands", marchand.id));
      const m = marchandSnap.exists() ? marchandSnap.data() : {};
      setCards(prev => [...prev, {
        walletId, marchandId: marchand.id,
        marchandNom: marchand.nom, logoUrl: marchand.logoUrl, couleur: marchand.couleur,
        stampsCurrent: 0, stampsObjective: (m.objectif_tampons as number) || 10,
        rewardName: (m.nom_recompense as string) || "Récompense", hasPushToken: false,
      }]);
      setMerchants(prev => prev.filter(m => m.id !== marchand.id));
      setJoined(prev => new Set(prev).add(marchand.id));
      setTab("cartes");
    } catch { /* silent */ }
    setJoining(prev => { const s = new Set(prev); s.delete(marchand.id); return s; });
  }

  function handleLogout() {
    localStorage.removeItem(PHONE_KEY);
    setPhone(""); setCards([]); setMerchants([]); setPrenom(""); setNom(""); setPhoneInput(""); setNotFound(false); setStep("login");
  }

  // ── Loading ────────────────────────────────────────────────────────
  if (step === "loading" || fetching) return (
    <main style={bg}>
      <Header />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(91,124,250,0.3)", borderTopColor: "#5B7CFA", animation: "spin 0.8s linear infinite" }} />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );

  // ── Login ──────────────────────────────────────────────────────────
  if (step === "login") return (
    <main style={bg}>
      <Header />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px 48px" }}>
        <div style={{ maxWidth: 390, width: "100%", margin: "0 auto" }}>

          <div style={{ ...glass, padding: "32px 28px", borderRadius: 28, marginBottom: 16 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: "#1C2333", marginBottom: 8 }}>Mes cartes</h1>
            <p style={{ fontSize: 14, color: "#8E9BB5", marginBottom: 28, lineHeight: 1.55 }}>
              Entrez votre numéro pour retrouver toutes vos cartes et découvrir de nouveaux établissements.
            </p>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <select value={countryCode} onChange={e => setCountryCode(e.target.value)} style={{ ...input, flexShrink: 0, width: 90, paddingLeft: 10, paddingRight: 10 }}>
                  {PAYS.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <input
                  type="tel" inputMode="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
                  placeholder="6 12 34 56 78" required style={{ ...input, flex: 1 }}
                  onFocus={e => (e.target.style.borderColor = "#5B7CFA")}
                  onBlur={e => (e.target.style.borderColor = "rgba(142,155,181,0.25)")}
                />
              </div>
              {notFound && <p style={{ fontSize: 13, color: "#FF453A", textAlign: "center" }}>Aucune carte trouvée pour ce numéro.</p>}
              <button type="submit" disabled={!phoneInput.trim()} style={{
                padding: "15px", borderRadius: 16, border: "none", cursor: phoneInput.trim() ? "pointer" : "not-allowed",
                background: phoneInput.trim() ? "linear-gradient(135deg,#5B7CFA,#7C5BFA)" : "rgba(142,155,181,0.15)",
                color: phoneInput.trim() ? "white" : "#8E9BB5", fontSize: 15, fontWeight: 600,
                boxShadow: phoneInput.trim() ? "0 8px 24px rgba(91,124,250,0.35)" : "none", transition: "all 0.2s",
              }}>
                Voir mes cartes
              </button>
            </form>
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: "#B0BAD0" }}>Wallio · cartes de fidélité digitales</p>
        </div>
      </div>
    </main>
  );

  // ── Main ───────────────────────────────────────────────────────────
  return (
    <main style={{ ...bg, justifyContent: "flex-start" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.card-appear{animation:fadeUp 0.4s cubic-bezier(.16,1,.3,1) both}`}</style>

      {/* Header */}
      <div style={{ padding: "52px 20px 0", maxWidth: 430, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <Header />
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, color: "#1C2333", marginTop: 12 }}>
              {prenom ? `Bonjour, ${prenom} !` : "Mes cartes"}
            </h1>
            <p style={{ fontSize: 13, color: "#8E9BB5", marginTop: 3 }}>{phone}</p>
          </div>
          <button onClick={handleLogout} style={{ background: "rgba(142,155,181,0.15)", border: "none", borderRadius: 12, padding: "8px 14px", fontSize: 13, color: "#8E9BB5", cursor: "pointer", fontWeight: 500, backdropFilter: "blur(8px)" }}>
            Changer
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, padding: "5px", background: "rgba(142,155,181,0.12)", borderRadius: 18, marginBottom: 20, backdropFilter: "blur(8px)" }}>
          {([["cartes", `Mes cartes (${cards.length})`], ["decouvrir", `Découvrir (${merchants.length})`]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: "10px", borderRadius: 13, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab === key ? "white" : "transparent",
              color: tab === key ? "#1C2333" : "#8E9BB5",
              boxShadow: tab === key ? "0 2px 12px rgba(100,120,160,0.15)" : "none",
              transition: "all 0.2s",
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "0 20px 48px", maxWidth: 430, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── Tab Mes cartes ── */}
        {tab === "cartes" && (
          cards.length === 0 ? (
            <div style={{ ...glass, padding: "40px 24px", borderRadius: 24, textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(91,124,250,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B7CFA" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="7" cy="14.5" r="1.5" fill="#5B7CFA" stroke="none"/></svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1C2333", marginBottom: 6 }}>Aucune carte</p>
              <p style={{ fontSize: 13, color: "#8E9BB5" }}>Scannez le tag NFC d'un établissement ou découvrez-en un dans l'onglet Découvrir.</p>
            </div>
          ) : cards.map((card, i) => <CardItem key={card.walletId} card={card} delay={i * 0.06} />)
        )}

        {/* ── Tab Découvrir ── */}
        {tab === "decouvrir" && (
          merchants.length === 0 ? (
            <div style={{ ...glass, padding: "40px 24px", borderRadius: 24, textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(52,199,89,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="1.8" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1C2333", marginBottom: 6 }}>Vous êtes partout !</p>
              <p style={{ fontSize: 13, color: "#8E9BB5" }}>Vous avez une carte dans tous les établissements Wallio.</p>
            </div>
          ) : merchants.map((m, i) => (
            <div key={m.id} className="card-appear" style={{ animationDelay: `${i * 0.06}s`, ...glass, borderRadius: 22, overflow: "hidden" }}>
              <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "center", gap: 14 }}>
                {m.logoUrl ? (
                  <img src={m.logoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 14, objectFit: "contain", background: "rgba(142,155,181,0.1)", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: m.couleur, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "white" }}>{m.nom[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "#1C2333", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.nom}</p>
                  <p style={{ fontSize: 12, color: "#8E9BB5" }}>Carte de fidélité disponible</p>
                </div>
                <button
                  onClick={() => rejoindre(m)}
                  disabled={joining.has(m.id) || joined.has(m.id)}
                  style={{
                    padding: "9px 18px", borderRadius: 12, border: "none", cursor: joining.has(m.id) ? "wait" : "pointer",
                    background: joined.has(m.id) ? "rgba(52,199,89,0.12)" : "linear-gradient(135deg,#5B7CFA,#7C5BFA)",
                    color: joined.has(m.id) ? "#34C759" : "white",
                    fontSize: 13, fontWeight: 600, flexShrink: 0,
                    boxShadow: joined.has(m.id) ? "none" : "0 4px 14px rgba(91,124,250,0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  {joining.has(m.id) ? "…" : joined.has(m.id) ? "Rejoint ✓" : "Rejoindre"}
                </button>
              </div>
              {!prenom && (
                <div style={{ padding: "10px 18px 14px", borderTop: "1px solid rgba(142,155,181,0.1)" }}>
                  <p style={{ fontSize: 12, color: "#8E9BB5", textAlign: "center" }}>
                    Scannez d'abord le NFC d'un établissement pour créer votre profil.
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "#B0BAD0", paddingBottom: 32 }}>Wallio · cartes de fidélité digitales</p>
    </main>
  );
}

function CardItem({ card, delay }: { card: CardData; delay: number }) {
  const pct = Math.min(100, Math.round((card.stampsCurrent / card.stampsObjective) * 100));
  const restants = card.stampsObjective - card.stampsCurrent;
  const dark = isColorDark(card.couleur);

  return (
    <div className="card-appear" style={{ animationDelay: `${delay}s`, borderRadius: 24, overflow: "hidden", boxShadow: "0 12px 40px rgba(100,120,160,0.18)" }}>
      {/* Card top — couleur du marchand */}
      <div style={{ background: card.couleur, padding: "20px 20px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {card.logoUrl
              ? <img src={card.logoUrl} alt="" style={{ height: 32, width: 32, borderRadius: 9, objectFit: "contain", background: "rgba(255,255,255,0.15)" }} />
              : <div style={{ height: 32, width: 32, borderRadius: 9, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: dark ? "white" : "#1C2333" }}>{card.marchandNom[0]?.toUpperCase()}</span>
                </div>
            }
            <span style={{ fontSize: 15, fontWeight: 600, color: dark ? "white" : "#1C2333", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.marchandNom}</span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: dark ? "white" : "#1C2333", letterSpacing: -0.5 }}>
            {card.stampsCurrent}<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.55 }}>/{card.stampsObjective}</span>
          </span>
        </div>

        {/* Progress */}
        <div style={{ height: 5, background: "rgba(255,255,255,0.2)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 10, background: dark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.45)", transition: "width 0.8s cubic-bezier(.16,1,.3,1)" }} />
        </div>
        <p style={{ fontSize: 12, color: dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)", marginTop: 8 }}>
          {restants > 0 ? `${restants} tampon${restants > 1 ? "s" : ""} avant : ${card.rewardName}` : `! ${card.rewardName} disponible`}
        </p>
      </div>

      {/* Card bottom — glass */}
      <div style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", padding: "14px 18px" }}>
        {!card.hasPushToken && (
          <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(255,149,0,0.08)", border: "1px solid rgba(255,149,0,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontSize: 11, color: "#FF9500", fontWeight: 500 }}>Re-téléchargez pour activer les mises à jour auto</span>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <a href={`/api/apple-wallet/generate/${card.walletId}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#000", borderRadius: 12, padding: "11px 16px", textDecoration: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="7" cy="14.5" r="1.5" fill="white" stroke="none"/></svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>Ajouter à Apple Wallet</span>
          </a>
          {process.env.NEXT_PUBLIC_GOOGLE_WALLET_ENABLED === "true" && (
            <a href={`/api/google-wallet/generate/${card.walletId}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#1a73e8", borderRadius: 12, padding: "11px 16px", textDecoration: "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>Ajouter à Google Wallet</span>
            </a>
          )}
          <p style={{ fontSize: 11, color: "#AEAEB2", textAlign: "center" }}>{pct === 100 ? "Récompense disponible !" : `${pct}% complété`}</p>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <WallioIcon size={34} />
      <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3, color: "#1C2333" }}>Wallio</span>
    </div>
  );
}

const bg: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(160deg, #EEF2F7 0%, #E4ECF8 50%, #EAE8F5 100%)",
  fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
  WebkitFontSmoothing: "antialiased",
  display: "flex", flexDirection: "column",
};

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

function isColorDark(hex: string): boolean {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#1C1C1E";
  const r = parseInt(h.slice(1,3),16)/255, g = parseInt(h.slice(3,5),16)/255, b = parseInt(h.slice(5,7),16)/255;
  const lin = (c: number) => c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4;
  return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b) < 0.35;
}
