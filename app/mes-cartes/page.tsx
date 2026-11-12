"use client";

import { useEffect, useState, useRef } from "react";
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { creerClient, getClientByTelephone, setClientEmail } from "@/lib/loyalty";
import InstallBanner from "@/components/InstallBanner";
import PasskeyRegisterBanner from "@/components/PasskeyRegisterBanner";
import { useLang } from "@/lib/lang-context";

interface CardData {
  clientId: string;
  walletId: string;
  marchandId: string;
  marchandNom: string;
  logoUrl?: string;
  couleur: string;
  stampsCurrent: number;
  stampsObjective: number;
  rewardName: string;
  hasPushToken: boolean;
  hasFcmToken: boolean;
  nfcId?: string;
  parrainageActif?: boolean;
  ville?: string;
  mapsUrl?: string;
  modeRecompense?: "cyclique" | "progressif" | "flex";
  paliers?: { tampons: number; recompense: string }[];
  paliersValides?: boolean[];
}

interface ClientNotif {
  id: string;
  title: string;
  body: string;
  marchandNom: string;
  marchandId: string;
  sentAt: string;
  read: boolean;
}

interface MarchandDiscover {
  id: string;
  nom: string;
  logoUrl?: string;
  couleur: string;
  nfc_id?: string;
  ville?: string;
}

const PHONE_KEY    = "wallio_client_phone";
const VERIFIED_KEY = "wallio_client_verified";
const PRENOM_KEY   = "wallio_client_prenom";
const NOM_KEY      = "wallio_client_nom";
const DOB_KEY      = "wallio_client_dob";

const PAYS = [
  { code: "+212", flag: "🇲🇦", label: "Maroc" },
  { code: "+213", flag: "🇩🇿", label: "Algérie" },
  { code: "+216", flag: "🇹🇳", label: "Tunisie" },
  { code: "+33",  flag: "🇫🇷", label: "France" },
  { code: "+32",  flag: "🇧🇪", label: "Belgique" },
  { code: "+34",  flag: "🇪🇸", label: "Espagne" },
  { code: "+40",  flag: "🇷🇴", label: "Roumanie" },
  { code: "+41",  flag: "🇨🇭", label: "Suisse" },
  { code: "+44",  flag: "🇬🇧", label: "Royaume-Uni" },
  { code: "+49",  flag: "🇩🇪", label: "Allemagne" },
  { code: "+971", flag: "🇦🇪", label: "Émirats" },
  { code: "+966", flag: "🇸🇦", label: "Arabie S." },
  { code: "+1",   flag: "🇺🇸", label: "USA/CA" },
];

export default function MesCartesPage() {
  const { t } = useLang();
  const [step, setStep]         = useState<"loading"|"login"|"pin"|"create_pin"|"main">(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(PHONE_KEY)) return "login";
    return "loading";
  });
  const [pinInput, setPinInput]   = useState("");
  const [pinError, setPinError]   = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [tab, setTab]           = useState<"cartes"|"messages"|"decouvrir">("cartes");
  const [countryCode, setCountryCode] = useState("+212");
  const [phoneInput, setPhoneInput]   = useState("");
  const [phone, setPhone]       = useState("");
  const [prenom, setPrenom]     = useState("");
  const [nom, setNom]           = useState("");
  const [dob, setDob]           = useState("");
  const [cards, setCards]       = useState<CardData[]>([]);
  const [clientEmail, setClientEmail2] = useState<string | null>(null); // null = pas encore chargé, "" = pas d'email
  const [emailInput, setEmailInput] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailDone, setEmailDone] = useState(false);
  const [merchants, setMerchants] = useState<MarchandDiscover[]>([]);
  const [fetching, setFetching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining]   = useState<Set<string>>(new Set());
  const [joined, setJoined]     = useState<Set<string>>(new Set());
  const [notifs, setNotifs]     = useState<ClientNotif[]>([]);
  const unsubRef = useRef<(() => void) | null>(null);
  const unsubMerchantsRef = useRef<(() => void) | null>(null);
  const registeredIdsRef = useRef<string[]>([]);
  const allMerchantsRef = useRef<MarchandDiscover[]>([]);

  function refreshMerchants() {
    setMerchants(allMerchantsRef.current.filter(m => !registeredIdsRef.current.includes(m.id)));
  }

  function setupMerchantsListener() {
    if (unsubMerchantsRef.current) return;
    const q = query(collection(db, "marchands"), where("actif", "==", true));
    unsubMerchantsRef.current = onSnapshot(q, snap => {
      allMerchantsRef.current = snap.docs.map(d => {
        const m = d.data();
        return { id: d.id, nom: m.nom || "Établissement", logoUrl: m.logo_url || undefined, couleur: m.apple_bg_color || m.couleur_principale || "#1C1C1E", nfc_id: m.nfc_id, ville: m.ville || undefined };
      });
      refreshMerchants();
    });
  }

  async function checkPinStep(telephone: string) {
    try {
      const snap = await getDocs(query(collection(db, "clients"), where("telephone", "==", telephone)));
      if (snap.empty) { localStorage.removeItem(PHONE_KEY); setStep("login"); return; }
      const hasPinHash = snap.docs.some((d: import("firebase/firestore").QueryDocumentSnapshot) => !!(d.data().pin_hash));
      setStep(hasPinHash ? "pin" : "create_pin");
    } catch { setStep("pin"); }
  }

  useEffect(() => {
    const forceLogin = new URLSearchParams(window.location.search).get("login") === "1";
    if (forceLogin) { setStep("login"); return; }
    const saved = localStorage.getItem(PHONE_KEY);
    const verified = localStorage.getItem(VERIFIED_KEY);
    if (saved && verified === "1") { setPhone(saved); loadCards(saved); }
    else if (saved) { setPhone(saved); checkPinStep(saved); }
    else setStep("login");
    const timeout = setTimeout(() => setStep(s => s === "loading" ? "login" : s), 8000);
    return () => { clearTimeout(timeout); unsubRef.current?.(); unsubMerchantsRef.current?.(); };
  }, []);

  async function loadCards(fullPhone: string) {
    // Annuler l'éventuel listener précédent
    unsubRef.current?.();
    setFetching(true); setNotFound(false);

    const q = query(collection(db, "clients"), where("telephone", "==", fullPhone));
    let firstSnapshot = true;

    unsubRef.current = onSnapshot(q, async (snap) => {
      if (snap.empty) {
        // Nouveau client venant de /inscription — profil en localStorage mais pas encore de carte
        const savedPrenom = localStorage.getItem(PRENOM_KEY);
        if (savedPrenom) {
          setPrenom(savedPrenom);
          setNom(localStorage.getItem(NOM_KEY) || "");
          setDob(localStorage.getItem(DOB_KEY) || "");
          registeredIdsRef.current = [];
          setupMerchantsListener();
          setTab("decouvrir");
          setStep("main");
        } else {
          setNotFound(true); setStep("login");
        }
        if (firstSnapshot) setFetching(false);
        firstSnapshot = false;
        return;
      }

      const results: CardData[] = [];
      let p = "", n = "", d = "";

      await Promise.all(snap.docs.map(async (clientDoc) => {
        const client = clientDoc.data();
        if (!p && client.prenom) { p = client.prenom; n = client.nom || ""; d = client.date_naissance || ""; }
        try {
          const marchandSnap = await getDoc(doc(db, "marchands", client.marchand_id));
          if (!marchandSnap.exists()) return;
          const m = marchandSnap.data();
          if (!m.actif) return;
          results.push({
            clientId: clientDoc.id,
            walletId: client.wallet_id,
            marchandId: client.marchand_id,
            marchandNom: (m.nom as string) || "Établissement",
            logoUrl: (m.logo_url as string) || undefined,
            couleur: (m.apple_bg_color as string) || (m.couleur_principale as string) || "#1C1C1E",
            stampsCurrent: client.tampons || 0,
            stampsObjective: (() => {
              if ((m.mode_recompense as string) === "flex") {
                const choixFait = (client as Record<string,unknown>).choix_fait as string | undefined;
                return choixFait === "grand"
                  ? ((m.objectif_tampons as number) || 10)
                  : ((m.palier_intermediaire as number) || 5);
              }
              return (m.objectif_tampons as number) || 10;
            })(),
            rewardName: (() => {
              if ((m.mode_recompense as string) === "flex") {
                const choixFait = (client as Record<string,unknown>).choix_fait as string | undefined;
                return choixFait === "grand"
                  ? ((m.nom_recompense_grand as string) || "Récompense")
                  : ((m.nom_recompense_petit as string) || "Récompense");
              }
              return (m.nom_recompense as string) || "Récompense";
            })(),
            hasPushToken: !!client.apns_push_token,
            hasFcmToken: !!client.fcm_token,
            nfcId: (m.nfc_id as string) || undefined,
            parrainageActif: !!(m.parrainage_actif as boolean),
            ville: (m.ville as string) || undefined,
            mapsUrl: (m.maps_url as string) || undefined,
            modeRecompense: (m.mode_recompense as "cyclique" | "progressif" | "flex") || undefined,
            paliers: (m.paliers as { tampons: number; recompense: string }[]) || undefined,
            paliersValides: (client.paliers_valides as boolean[]) || undefined,
          });
        } catch { /* skip */ }
      }));

      setPrenom(p); setNom(n); setDob(d);
      if (p) { localStorage.setItem(PRENOM_KEY, p); localStorage.setItem(NOM_KEY, n); if (d) localStorage.setItem(DOB_KEY, d); }
      setCards(results);

      // Détecter si un email existe déjà sur l'un des docs client
      const foundEmail = snap.docs.map(d => d.data().email as string | undefined).find(e => !!e) ?? "";
      setClientEmail2(foundEmail);

      // Agrège toutes les notifs de tous les marchands, triées par date desc
      const allNotifs: ClientNotif[] = [];
      snap.docs.forEach(d => {
        const raw = d.data().notifs as ClientNotif[] | undefined;
        if (raw?.length) allNotifs.push(...raw);
      });
      allNotifs.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
      setNotifs(allNotifs.slice(0, 50));

      registeredIdsRef.current = results.map(c => c.marchandId);
      refreshMerchants();
      setStep("main");
      if (firstSnapshot) {
        setupMerchantsListener();
        setFetching(false);
        firstSnapshot = false;
      }
    }, () => { setNotFound(true); setStep("login"); setFetching(false); });
  }


  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const local = phoneInput.replace(/\D/g, "").replace(/^0/, "");
    if (!local) return;
    const full = `${countryCode}${local}`;
    setPhone(full); localStorage.setItem(PHONE_KEY, full);
    setPinLoading(true);
    await checkPinStep(full);
    setPinLoading(false);
  }

  async function handleVerifyPin(e: React.FormEvent) {
    e.preventDefault();
    if (pinInput.length !== 4 || !phone) return;
    setPinLoading(true); setPinError("");
    try {
      const res = await fetch("/api/client/verify-pin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telephone: phone, pin: pinInput }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem(VERIFIED_KEY, "1");
        await loadCards(phone);
      } else {
        setPinError("Code incorrect. Réessayez.");
        setPinInput("");
      }
    } catch { setPinError("Erreur. Réessayez."); }
    finally { setPinLoading(false); }
  }

  async function handleCreatePin(e: React.FormEvent) {
    e.preventDefault();
    if (pinInput.length !== 4 || !phone) return;
    setPinLoading(true); setPinError("");
    try {
      const res = await fetch("/api/client/set-pin", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telephone: phone, pin: pinInput }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem(VERIFIED_KEY, "1");
        await loadCards(phone);
      } else { setPinError("Erreur. Réessayez."); }
    } catch { setPinError("Erreur. Réessayez."); }
    finally { setPinLoading(false); }
  }

  async function rejoindre(marchand: MarchandDiscover) {
    if (!phone || !prenom) return;
    setJoining(prev => new Set(prev).add(marchand.id));
    try {
      const existing = await getClientByTelephone(phone, marchand.id);
      let clientId: string;
      let walletId: string;
      if (existing) {
        clientId = existing.id;
        walletId = existing.wallet_id;
      } else {
        const result = await creerClient({
          prenom, nom, telephone: phone,
          date_naissance: dob || "",
          marchand_id: marchand.id,
        });
        clientId = result.clientId;
        walletId = result.walletId;
      }
      void clientId;
      localStorage.setItem(`wallio_${marchand.id}`, walletId);
      const marchandSnap = await getDoc(doc(db, "marchands", marchand.id));
      const m = marchandSnap.exists() ? marchandSnap.data() : {};
      setCards(prev => [...prev, {
        clientId, walletId, marchandId: marchand.id,
        marchandNom: marchand.nom, logoUrl: marchand.logoUrl, couleur: marchand.couleur,
        stampsCurrent: existing?.tampons ?? 0,
        stampsObjective: (m.mode_recompense as string) === "flex"
          ? ((m.palier_intermediaire as number) || 5)
          : ((m.objectif_tampons as number) || 10),
        rewardName: (m.mode_recompense as string) === "flex"
          ? ((m.nom_recompense_petit as string) || "Récompense")
          : ((m.nom_recompense as string) || "Récompense"),
        hasPushToken: false, hasFcmToken: false,
      }]);
      setMerchants(prev => prev.filter(m => m.id !== marchand.id));
      setJoined(prev => new Set(prev).add(marchand.id));
      setTab("cartes");
    } catch { /* silent */ }
    setJoining(prev => { const s = new Set(prev); s.delete(marchand.id); return s; });
  }

  const [isAndroid, setIsAndroid] = useState(false);
  useEffect(() => { setIsAndroid(/android/i.test(navigator.userAgent)); }, []);

  const [enablingNotif, setEnablingNotif] = useState(false);

  async function enableNotifications(_targetClientId: string) {
    if (enablingNotif) return;
    setEnablingNotif(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setEnablingNotif(false); return; }
      const { registerFcmToken } = await import("@/lib/fcm");
      const token = await registerFcmToken();
      if (!token) { setEnablingNotif(false); return; }
      // Sauvegarde le token sur TOUTES les cartes du client (tous marchands)
      await Promise.all(cards.map(c => updateDoc(doc(db, "clients", c.clientId), { fcm_token: token })));
      setCards(prev => prev.map(c => ({ ...c, hasFcmToken: true })));
    } catch (err) {
      console.error("enableNotifications:", err);
    }
    setEnablingNotif(false);
  }

  function handleLogout() {
    unsubRef.current?.();
    unsubRef.current = null;
    localStorage.removeItem(PHONE_KEY);
    localStorage.removeItem(VERIFIED_KEY);
    setPhone(""); setCards([]); setMerchants([]); setPrenom(""); setNom(""); setPhoneInput(""); setNotFound(false); setPinInput(""); setPinError(""); setStep("login");
  }

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    if (!phone) return;
    setDeleting(true);
    const walletId = cards[0]?.walletId;
    if (!walletId) { setDeleting(false); return; }
    try {
      await fetch("/api/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telephone: phone, walletId }),
      });
    } catch { /* on nettoie quand même */ }

    // Vider tout le localStorage wallio_* + verified
    const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith("wallio_"));
    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(VERIFIED_KEY);
    // Vider le cookie partagé PWA↔Safari
    document.cookie = "wallio_p=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";

    unsubRef.current?.();
    unsubRef.current = null;
    setPhone(""); setCards([]); setMerchants([]); setPrenom(""); setNom("");
    setPhoneInput(""); setNotFound(false); setDeleteConfirm(false); setDeleting(false);
    setStep("login");
  }

  // ── Loading ────────────────────────────────────────────────────────
  // Ne jamais spinner si pas de téléphone connu (cas visiteur depuis landing)
  const hasPhone = typeof window !== "undefined" && !!localStorage.getItem(PHONE_KEY);
  if ((step === "loading" || fetching) && hasPhone) return (
    <main style={bg}>
      <div style={{ padding: "20px 20px 0", maxWidth: 430, margin: "0 auto", width: "100%" }}>
        <Header />
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(91,124,250,0.3)", borderTopColor: "#5B7CFA", animation: "spin 0.8s linear infinite" }} />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );

  // ── PIN ────────────────────────────────────────────────────────────
  const pinScreen = (title: string, subtitle: string, btnLabel: string, onSubmit: (e: React.FormEvent) => void) => (
    <main style={bg}>
      <div style={{ padding: "20px 20px 0", maxWidth: 430, margin: "0 auto", width: "100%" }}>
        <Header />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px 48px" }}>
        <div style={{ maxWidth: 390, width: "100%", margin: "0 auto" }}>
          <div style={{ ...glass, padding: "32px 28px", borderRadius: 28, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: "linear-gradient(135deg,rgba(91,124,250,0.12),rgba(124,91,250,0.12))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B7CFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, color: "#1C2333", marginBottom: 6 }}>{title}</h1>
            <p style={{ fontSize: 14, color: "#8E9BB5", marginBottom: 28, lineHeight: 1.55 }}>{subtitle}</p>
            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="password" inputMode="numeric" pattern="\d{4}" maxLength={4}
                placeholder="••••" value={pinInput}
                onChange={e => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                autoFocus
                style={{ ...input, textAlign: "center", fontSize: 28, letterSpacing: "0.6em", fontWeight: 700 }}
                onFocus={e => (e.target.style.borderColor = "#5B7CFA")}
                onBlur={e => (e.target.style.borderColor = "rgba(142,155,181,0.25)")}
              />
              {pinError && <p style={{ fontSize: 13, color: "#FF453A", textAlign: "center" }}>{pinError}</p>}
              <button type="submit" disabled={pinInput.length !== 4 || pinLoading} style={{
                padding: "15px", borderRadius: 16, border: "none",
                cursor: pinInput.length === 4 && !pinLoading ? "pointer" : "not-allowed",
                background: pinInput.length === 4 && !pinLoading ? "linear-gradient(135deg,#5B7CFA,#7C5BFA)" : "rgba(142,155,181,0.15)",
                color: pinInput.length === 4 && !pinLoading ? "white" : "#8E9BB5",
                fontSize: 15, fontWeight: 600,
                boxShadow: pinInput.length === 4 && !pinLoading ? "0 8px 24px rgba(91,124,250,0.35)" : "none",
                transition: "all 0.2s",
              }}>
                {pinLoading ? "…" : btnLabel}
              </button>
            </form>
            {step === "pin" && (
              <p style={{ fontSize: 13, color: "#8E9BB5", textAlign: "center", marginTop: 16 }}>
                Code oublié ?{" "}
                <a href="mailto:hello@walliocard.com" style={{ color: "#5B7CFA", fontWeight: 600, textDecoration: "none" }}>
                  Contactez-nous
                </a>
              </p>
            )}
          </div>
          <button onClick={() => { setPhone(""); setPinInput(""); setPinError(""); localStorage.removeItem(PHONE_KEY); setStep("login"); }}
            style={{ display: "block", width: "100%", textAlign: "center", fontSize: 13, color: "#8E9BB5", background: "none", border: "none", cursor: "pointer", padding: "8px 0" }}>
            ← Changer de numéro
          </button>
        </div>
      </div>
    </main>
  );

  if (step === "pin") return pinScreen(
    "Votre code PIN",
    `Entrez votre code à 4 chiffres pour accéder à vos cartes.`,
    "Continuer",
    handleVerifyPin
  );

  if (step === "create_pin") return pinScreen(
    "Créez votre code PIN",
    "Choisissez un code à 4 chiffres pour sécuriser votre compte.",
    "Créer mon code",
    handleCreatePin
  );

  // ── Login ──────────────────────────────────────────────────────────
  if (step === "login") return (
    <main style={bg}>
      <div style={{ padding: "20px 20px 0", maxWidth: 430, margin: "0 auto", width: "100%" }}>
        <Header />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px 48px" }}>
        <div style={{ maxWidth: 390, width: "100%", margin: "0 auto" }}>

          <div style={{ ...glass, padding: "32px 28px", borderRadius: 28, marginBottom: 16 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: "#1C2333", marginBottom: 8 }}>{t.mes_cartes_title}</h1>
            <p style={{ fontSize: 14, color: "#8E9BB5", marginBottom: 28, lineHeight: 1.55 }}>
              {t.mes_cartes_subtitle}
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
              {notFound && <p style={{ fontSize: 13, color: "#FF453A", textAlign: "center" }}>{t.mes_cartes_not_found}</p>}
              <button type="submit" disabled={!phoneInput.trim()} style={{
                padding: "15px", borderRadius: 16, border: "none", cursor: phoneInput.trim() ? "pointer" : "not-allowed",
                background: phoneInput.trim() ? "linear-gradient(135deg,#5B7CFA,#7C5BFA)" : "rgba(142,155,181,0.15)",
                color: phoneInput.trim() ? "white" : "#8E9BB5", fontSize: 15, fontWeight: 600,
                boxShadow: phoneInput.trim() ? "0 8px 24px rgba(91,124,250,0.35)" : "none", transition: "all 0.2s",
              }}>
                {t.mes_cartes_see}
              </button>
            </form>
          </div>

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <p style={{ fontSize: 13, color: "#8E9BB5", marginBottom: 12 }}>{t.mes_cartes_no_card}</p>
            <a href="/inscription" style={{
              display: "inline-block", fontSize: 14, fontWeight: 600,
              color: "#5B7CFA", textDecoration: "none",
              padding: "12px 28px", borderRadius: 14,
              background: "rgba(91,124,250,0.08)", border: "1px solid rgba(91,124,250,0.2)",
            }}>
              {t.mes_cartes_create}
            </a>
          </div>
        </div>
      </div>
    </main>
  );

  // ── Main ───────────────────────────────────────────────────────────
  return (
    <main style={{ ...bg, justifyContent: "flex-start" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.card-appear{animation:fadeUp 0.4s cubic-bezier(.16,1,.3,1) both}`}</style>

      {/* Header */}
      <div style={{ padding: "20px 20px 0", maxWidth: 430, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <Header />
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, color: "#1C2333", marginTop: 12 }}>
              {prenom ? `Bonjour, ${prenom} !` : "Mes cartes"}
            </h1>
            <p style={{ fontSize: 13, color: "#8E9BB5", marginTop: 3 }}>{phone}</p>
          </div>
          <button onClick={handleLogout} style={{ background: "rgba(142,155,181,0.15)", border: "none", borderRadius: 12, padding: "8px 14px", fontSize: 13, color: "#8E9BB5", cursor: "pointer", fontWeight: 500, backdropFilter: "blur(8px)" }}>
            {t.mes_cartes_change}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, padding: "5px", background: "rgba(142,155,181,0.12)", borderRadius: 18, marginBottom: 20, backdropFilter: "blur(8px)" }}>
          {([
            ["cartes", `${t.mes_cartes_tab_cards} (${cards.length})`],
            ["messages", notifs.filter(n => !n.read).length > 0 ? `${t.mes_cartes_tab_messages} (${notifs.filter(n => !n.read).length})` : t.mes_cartes_tab_messages],
            ["decouvrir", `${t.mes_cartes_tab_discover} (${merchants.length})`],
          ] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: "10px", borderRadius: 13, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
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
        <InstallBanner />
        {phone && <PasskeyRegisterBanner telephone={phone} />}

        {/* ── Prompt email — affiché une seule fois si pas d'email ── */}
        {phone && clientEmail === "" && cards.length > 0 && !emailDone && (
          <div style={{ background: "white", borderRadius: 20, padding: "16px 18px", border: "1px solid rgba(99,102,241,0.14)", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1C2333", marginBottom: 4 }}>Recevez votre carte par email</p>
            <p style={{ fontSize: 12, color: "#6E7A95", marginBottom: 12 }}>Entrez votre email pour recevoir un lien vers vos cartes.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="email" placeholder="votre@email.com" value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(99,102,241,0.2)", fontSize: 14, outline: "none", color: "#1C2333", background: "#F8F9FF" }} />
              <button
                disabled={!emailInput.includes("@") || emailSending}
                onClick={async () => {
                  if (!emailInput.includes("@") || !phone) return;
                  setEmailSending(true);
                  try {
                    await setClientEmail(phone, emailInput.trim());
                    fetch("/api/send-welcome-email", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: emailInput.trim(), prenom, walletId: cards[0]?.walletId, mode: "mes-cartes" }),
                    }).catch(() => {});
                    setEmailDone(true);
                  } catch { /* silent */ }
                  finally { setEmailSending(false); }
                }}
                style={{ padding: "10px 16px", borderRadius: 12, background: "linear-gradient(135deg,#007AFF,#8B5CF6)", color: "white", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !emailInput.includes("@") || emailSending ? 0.5 : 1 }}>
                {emailSending ? "…" : "Envoyer"}
              </button>
            </div>
          </div>
        )}
        {emailDone && (
          <div style={{ background: "rgba(52,199,89,0.08)", borderRadius: 16, padding: "12px 16px", border: "1px solid rgba(52,199,89,0.2)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1C7A37" }}>Email envoyé !</p>
          </div>
        )}

        {/* ── Tab Mes cartes ── */}
        {tab === "cartes" && (
          cards.length === 0 ? (
            <div style={{ ...glass, padding: "40px 24px", borderRadius: 24, textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(91,124,250,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B7CFA" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="7" cy="14.5" r="1.5" fill="#5B7CFA" stroke="none"/></svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1C2333", marginBottom: 6 }}>{t.mes_cartes_empty_cards}</p>
              <p style={{ fontSize: 13, color: "#8E9BB5" }}>{t.mes_cartes_empty_cards_sub}</p>
            </div>
          ) : (() => {
            const grouped: Record<string, typeof cards> = {};
            cards.forEach(c => { const k = c.ville || "Autres"; grouped[k] = grouped[k] || []; grouped[k].push(c); });
            const sortedVilles = Object.keys(grouped).sort((a, b) => a === "Autres" ? 1 : b === "Autres" ? -1 : a.localeCompare(b, "fr"));
            let idx = 0;
            return sortedVilles.map(ville => (
              <div key={ville}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#8E9BB5", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8, marginTop: 4, paddingLeft: 2 }}>{ville}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {grouped[ville].map(card => <CardItem key={card.walletId} card={card} delay={(idx++) * 0.06} onEnableNotif={() => enableNotifications(card.clientId)} enablingNotif={enablingNotif} isAndroid={isAndroid} />)}
                </div>
              </div>
            ));
          })()
        )}

        {/* ── Tab Messages ── */}
        {tab === "messages" && (
          notifs.length === 0 ? (
            <div style={{ ...glass, padding: "40px 24px", borderRadius: 24, textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1C2333", marginBottom: 6 }}>{t.mes_cartes_empty_messages}</p>
              <p style={{ fontSize: 13, color: "#8E9BB5" }}>{t.mes_cartes_empty_messages_sub}</p>
            </div>
          ) : notifs.map(n => {
            const card = cards.find(c => c.marchandId === n.marchandId);
            const date = new Date(n.sentAt);
            const dateStr = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
            const timeStr = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={n.id} style={{
                ...glass, borderRadius: 20, overflow: "hidden",
                opacity: n.read ? 0.7 : 1,
              }}>
                <div style={{ padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  {card?.logoUrl ? (
                    <img src={card.logoUrl} alt="" style={{ width: 40, height: 40, borderRadius: 12, objectFit: "contain", background: "rgba(142,155,181,0.1)", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: card?.couleur || "#5B7CFA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{n.marchandNom[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1C2333" }}>{n.title}</p>
                      <p style={{ fontSize: 11, color: "#8E9BB5", flexShrink: 0, marginLeft: 8 }}>{dateStr} {timeStr}</p>
                    </div>
                    <p style={{ fontSize: 13, color: "#6E7A8A", lineHeight: 1.45 }}>{n.body}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* ── Tab Découvrir ── */}
        {tab === "decouvrir" && (
          merchants.length === 0 ? (
            <div style={{ ...glass, padding: "40px 24px", borderRadius: 24, textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(52,199,89,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="1.8" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#1C2333", marginBottom: 6 }}>{t.mes_cartes_empty_discover}</p>
              <p style={{ fontSize: 13, color: "#8E9BB5" }}>{t.mes_cartes_empty_discover_sub}</p>
            </div>
          ) : (() => {
            const grouped: Record<string, typeof merchants> = {};
            merchants.forEach(m => { const k = m.ville || "Autres"; grouped[k] = grouped[k] || []; grouped[k].push(m); });
            const sortedVilles = Object.keys(grouped).sort((a, b) => a === "Autres" ? 1 : b === "Autres" ? -1 : a.localeCompare(b, "fr"));
            return sortedVilles.map(ville => (
              <div key={ville}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#8E9BB5", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8, marginTop: 4, paddingLeft: 2 }}>{ville}</p>
                {grouped[ville].map((m, i) => (
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
                  <p style={{ fontSize: 12, color: "#8E9BB5" }}>{t.mes_cartes_loyalty}</p>
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
                  {joining.has(m.id) ? "…" : joined.has(m.id) ? t.mes_cartes_joined : t.mes_cartes_join}
                </button>
              </div>
              {!prenom && (
                <div style={{ padding: "10px 18px 14px", borderTop: "1px solid rgba(142,155,181,0.1)" }}>
                  <p style={{ fontSize: 12, color: "#8E9BB5", textAlign: "center" }}>
                    {t.mes_cartes_nfc_required}
                  </p>
                </div>
              )}
            </div>
                ))}
              </div>
            ));
          })()
        )}
      </div>

      {/* Supprimer mon compte */}
      <div style={{ textAlign: "center", paddingBottom: 40, paddingTop: 8 }}>
        <button
          onClick={() => setDeleteConfirm(true)}
          style={{ fontSize: 12, color: "#C0C8D8", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
          {t.mes_cartes_delete_account}
        </button>
      </div>

      {/* Modal confirmation suppression */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}>
          <div style={{ width: "100%", maxWidth: 430, background: "#FFFFFF", borderRadius: "24px 24px 0 0", padding: "28px 24px 48px" }}>
            <div style={{ width: 36, height: 4, background: "rgba(0,0,0,0.1)", borderRadius: 2, margin: "0 auto 24px" }} />
            <p style={{ fontSize: 18, fontWeight: 700, color: "#1C2333", marginBottom: 8, textAlign: "center" }}>{t.mes_cartes_delete_title}</p>
            <p style={{ fontSize: 14, color: "#8E9BB5", lineHeight: 1.6, textAlign: "center", marginBottom: 28 }}>
              {t.mes_cartes_delete_body}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{ width: "100%", padding: "15px 0", borderRadius: 14, background: "#FF3B30", color: "white", fontSize: 16, fontWeight: 700, border: "none", cursor: deleting ? "default" : "pointer", opacity: deleting ? 0.6 : 1 }}>
                {deleting ? t.mes_cartes_deleting : t.mes_cartes_delete_confirm}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{ width: "100%", padding: "15px 0", borderRadius: 14, background: "rgba(0,0,0,0.05)", color: "#1C2333", fontSize: 16, fontWeight: 500, border: "none", cursor: "pointer" }}>
                {t.mes_cartes_delete_cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      <p style={{ textAlign: "center", fontSize: 12, color: "#B0BAD0", paddingBottom: 8 }}>{t.mes_cartes_footer}</p>
      <p style={{ textAlign: "center", fontSize: 11, color: "#C7C7CC", paddingBottom: 24, display: "flex", justifyContent: "center", gap: 16 }}>
        <a href="/privacy" style={{ color: "#C7C7CC", textDecoration: "none" }}>Confidentialité</a>
        <a href="/terms" style={{ color: "#C7C7CC", textDecoration: "none" }}>CGU</a>
        <a href="/legal" style={{ color: "#C7C7CC", textDecoration: "none" }}>Mentions légales</a>
      </p>
    </main>
  );
}

function CardItem({ card, delay, onEnableNotif, enablingNotif, isAndroid }: { card: CardData; delay: number; onEnableNotif: () => void; enablingNotif: boolean; isAndroid: boolean }) {
  const mapsHref = card.mapsUrl || (card.ville ? `https://maps.google.com/?q=${encodeURIComponent(`${card.marchandNom} ${card.ville}`)}` : null);
  const { t } = useLang();

  let displayObjectif = card.stampsObjective;
  let displayReward = card.rewardName;
  if (card.modeRecompense === "progressif" && card.paliers?.length) {
    const pv = card.paliersValides || [];
    const prochain = card.paliers.find((p, i) => !pv[i]) ?? card.paliers[card.paliers.length - 1];
    displayObjectif = prochain.tampons;
    displayReward = prochain.recompense;
  }
  const pct = Math.min(100, Math.round((card.stampsCurrent / displayObjectif) * 100));
  const restants = displayObjectif - card.stampsCurrent;
  const dark = isColorDark(card.couleur);
  const [copied, setCopied] = useState(false);

  function partager() {
    const base = card.nfcId
      ? `${window.location.origin}/nfc/${card.nfcId}?ref=${card.walletId}`
      : `${window.location.origin}/ref/${card.walletId}`;
    const message = `Salut ! Je suis client chez ${card.marchandNom} et je t'invite à rejoindre leur programme de fidélité. Crée ta carte gratuitement, viens au restaurant, et on gagne tous les deux un tampon bonus :\n${base}`;
    if (navigator.share) {
      navigator.share({ text: message }).catch(() => {});
    } else {
      navigator.clipboard.writeText(message).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  }

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
          {restants > 0 ? `${restants} ${restants > 1 ? t.mes_cartes_stamps_before_pl : t.mes_cartes_stamps_before} → ${displayReward}` : `${t.mes_cartes_reward_available} ${displayReward}`}
        </p>
      </div>

      {/* Card bottom — glass */}
      <div style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", padding: "14px 18px" }}>
        {!card.hasPushToken && (
          <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(255,149,0,0.08)", border: "1px solid rgba(255,149,0,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontSize: 11, color: "#FF9500", fontWeight: 500 }}>{t.mes_cartes_redownload}</span>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {!isAndroid && (
            <a href={`/api/apple-wallet/generate/${card.walletId}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#000", borderRadius: 12, padding: "11px 16px", textDecoration: "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><circle cx="7" cy="14.5" r="1.5" fill="white" stroke="none"/></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{t.mes_cartes_apple_wallet}</span>
            </a>
          )}
          {isAndroid && process.env.NEXT_PUBLIC_GOOGLE_WALLET_ENABLED === "true" && (
            <a href={`/api/google-wallet/generate/${card.walletId}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#1a73e8", borderRadius: 12, padding: "11px 16px", textDecoration: "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{t.mes_cartes_google_wallet}</span>
            </a>
          )}
          <p style={{ fontSize: 11, color: "#AEAEB2", textAlign: "center" }}>{pct === 100 ? "Récompense disponible !" : `${pct}% complété`}</p>

          {card.parrainageActif && card.nfcId && (
            <button
              onClick={partager}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "10px 16px", borderRadius: 12,
                border: `1.5px solid ${card.couleur}44`,
                background: `${card.couleur}10`,
                cursor: "pointer", width: "100%",
                color: card.couleur, fontSize: 13, fontWeight: 600,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              {copied ? t.mes_cartes_link_copied : t.mes_cartes_invite}
            </button>
          )}

          {mapsHref && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "10px 16px", borderRadius: 12,
                border: "1.5px solid rgba(142,155,181,0.25)",
                background: "rgba(142,155,181,0.08)",
                textDecoration: "none", width: "100%",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6E7A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#6E7A8A" }}>Y aller</span>
            </a>
          )}

          {/* Activer les notifications si pas encore fait */}
          {!card.hasFcmToken && typeof window !== "undefined" && "Notification" in window && Notification.permission !== "denied" && (
            <button
              onClick={onEnableNotif}
              disabled={enablingNotif}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "10px 16px", borderRadius: 12, border: "1.5px solid rgba(91,124,250,0.3)",
                background: "rgba(91,124,250,0.06)", cursor: enablingNotif ? "wait" : "pointer",
                color: "#5B7CFA", fontSize: 13, fontWeight: 600,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5B7CFA" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              {enablingNotif ? t.mes_cartes_enabling_notif : t.mes_cartes_enable_notif}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <img src="/wallio-instagram-profil.png" alt="Wallio" style={{ width: 38, height: 38, borderRadius: 10, display: "block" }} />
    </div>
  );
}

const bg: React.CSSProperties = {
  minHeight: "100dvh",
  fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
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

function isColorDark(hex: string): boolean {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#1C1C1E";
  const r = parseInt(h.slice(1,3),16)/255, g = parseInt(h.slice(3,5),16)/255, b = parseInt(h.slice(5,7),16)/255;
  const lin = (c: number) => c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4;
  return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b) < 0.35;
}
