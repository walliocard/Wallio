"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { creerClient, getClientByTelephone, setClientEmail } from "@/lib/loyalty";
import InstallBanner from "@/components/InstallBanner";
import PasskeyRegisterBanner from "@/components/PasskeyRegisterBanner";
import DiscoverMap from "@/components/DiscoverMap";
import { useLang } from "@/lib/lang-context";

interface CardData {
  clientId: string;
  walletId: string;
  marchandId: string;
  marchandNom: string;
  logoUrl?: string;
  logoShape?: "square" | "round";
  logoCircleUrl?: string;
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
  logoShape?: "square" | "round";
  logoCircleUrl?: string;
  couleur: string;
  nfc_id?: string;
  ville?: string;
  categorie?: string;
  banner?: string;
  objectif?: number;
  reward?: string;
  latitude?: number;
  longitude?: number;
  dateInscription?: number;
  mapsUrl?: string;
}

const DISCOVER_CATS: Record<string, string> = { cafe: "Café", coffee_shop: "Coffee shop", matcha_bar: "Matcha bar", restaurant: "Restaurant", boulangerie: "Boulangerie", patisserie: "Pâtisserie", barbier: "Barbier", coiffure: "Coiffure", beaute: "Beauté", autre: "Autre" };

const IS_IOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

const PHONE_KEY    = "wallio_client_phone";
const VERIFIED_KEY = "wallio_client_verified";
const PRENOM_KEY   = "wallio_client_prenom";
const NOM_KEY      = "wallio_client_nom";
const DOB_KEY      = "wallio_client_dob";
const FCM_CACHE_KEY = "wallio_fcm_cache";

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

// Cache mémoire des cartes : survit aux allers-retours de navigation (pas au rechargement complet de l'app).
let cardsCache: { phone: string; cards: CardData[]; prenom: string; nom: string; notifs: ClientNotif[] } | null = null;

export default function MesCartesPage() {
  const { t } = useLang();
  const [step, setStep]         = useState<"loading"|"login"|"pin"|"forgot_pin"|"reset_code"|"create_pin"|"main">(() => {
    if (typeof window === "undefined") return "loading";
    const ph = localStorage.getItem(PHONE_KEY);
    if (!ph) return "login";
    if (cardsCache && cardsCache.phone === ph) return "main"; // retour instantané depuis le cache
    return "loading";
  });
  const [pinInput, setPinInput]   = useState("");
  const [pinError, setPinError]   = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError]   = useState("");
  const [otpCode, setOtpCode]     = useState("");
  const [dobInput, setDobInput]   = useState("");
  const [resetEmailMasked, setResetEmailMasked] = useState("");
  const [isWallioUser, setIsWallioUser] = useState(false);
  const [tab, setTab]           = useState<"cartes"|"messages"|"map"|"decouvrir">("cartes");
  const [openMsgCommerce, setOpenMsgCommerce] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState("tous");
  const router = useRouter();

  // Ouverture directe sur un onglet via l'URL (ex. /mes-cartes?tab=map)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const tb = p.get("tab");
    if (tb === "decouvrir") setTab("decouvrir");
    else if (tb === "map" || p.get("view") === "carte") setTab("map");
  }, []);
  const [countryCode, setCountryCode] = useState("+212");
  const [phoneInput, setPhoneInput]   = useState("");
  const [phone, setPhone]       = useState(() => cardsCache?.phone ?? "");
  const [prenom, setPrenom]     = useState(() => cardsCache?.prenom ?? "");
  const [nom, setNom]           = useState(() => cardsCache?.nom ?? "");
  const [dob, setDob]           = useState("");
  const [cards, setCards]       = useState<CardData[]>(() => cardsCache?.cards ?? []);
  const [clientEmail, setClientEmail2] = useState<string | null>(null); // null = pas encore chargé, "" = pas d'email
  const [emailInput, setEmailInput] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailDone, setEmailDone] = useState(false);
  const [merchants, setMerchants] = useState<MarchandDiscover[]>([]);
  const [fetching, setFetching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining]   = useState<Set<string>>(new Set());
  const [joined, setJoined]     = useState<Set<string>>(new Set());
  const [notifs, setNotifs]     = useState<ClientNotif[]>(() => cardsCache?.notifs ?? []);
  const unsubRef = useRef<(() => void) | null>(null);
  const unsubMerchantsRef = useRef<(() => void) | null>(null);
  const registeredIdsRef = useRef<string[]>([]);
  const allMerchantsRef = useRef<MarchandDiscover[]>([]);
  const notifsMapRef = useRef<Map<string, ClientNotif[]>>(new Map());
  const tokenRefreshedRef = useRef(false);

  function refreshMerchants() {
    setMerchants(allMerchantsRef.current.filter(m => !registeredIdsRef.current.includes(m.id)));
  }

  function setupMerchantsListener() {
    if (unsubMerchantsRef.current) return;
    const q = query(collection(db, "marchands"), where("actif", "==", true));
    unsubMerchantsRef.current = onSnapshot(q, snap => {
      allMerchantsRef.current = snap.docs.map(d => {
        const m = d.data();
        const di = m.date_inscription as { seconds?: number } | undefined;
        return {
          id: d.id, nom: m.nom || "Établissement", logoUrl: m.logo_url || undefined,
          logoShape: (m.logo_shape as "square" | "round") || "square", logoCircleUrl: m.logo_circle_url || undefined,
          couleur: m.apple_bg_color || m.couleur_principale || "#1C1C1E", nfc_id: m.nfc_id, ville: m.ville || undefined,
          categorie: (m.categorie as string) || undefined,
          banner: (m.strip_url as string) || (m.strip_raw_url as string) || undefined,
          objectif: (m.mode_recompense === "flex" ? (m.palier_intermediaire as number) : (m.objectif_tampons as number)) || undefined,
          reward: (m.mode_recompense === "flex" ? (m.nom_recompense_petit as string) : (m.nom_recompense as string)) || undefined,
          latitude: typeof m.latitude === "number" ? m.latitude : undefined,
          longitude: typeof m.longitude === "number" ? m.longitude : undefined,
          dateInscription: di?.seconds,
          mapsUrl: (m.maps_url as string) || undefined,
        };
      });
      refreshMerchants();
    });
  }

  async function checkPinStep(telephone: string) {
    try {
      const snap = await getDocs(query(collection(db, "clients"), where("telephone", "==", telephone)));
      if (snap.empty) {
        // Pas de clients Firestore — vérifier wallio_users
        const res = await fetch(`/api/client/check-user?telephone=${encodeURIComponent(telephone)}`);
        const data = await res.json();
        if (data.exists) {
          setIsWallioUser(true);
          if (data.hasPin) {
            setStep("pin");
          } else {
            localStorage.setItem(VERIFIED_KEY, "1");
            await loadCards(telephone);
          }
          return;
        }
        localStorage.removeItem(PHONE_KEY); setNotFound(true); setStep("login"); return;
      }
      setIsWallioUser(false);
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
    document.body.style.overscrollBehavior = "auto";
    document.documentElement.style.overscrollBehavior = "auto";
    return () => { clearTimeout(timeout); unsubRef.current?.(); unsubMerchantsRef.current?.(); document.body.style.overscrollBehavior = ""; document.documentElement.style.overscrollBehavior = ""; };
  }, []);

  async function loadCards(fullPhone: string) {
    // Annuler l'éventuel listener précédent
    unsubRef.current?.();
    // Pas de spinner si on a déjà les cartes en cache (rafraîchissement silencieux)
    if (!(cardsCache && cardsCache.phone === fullPhone)) setFetching(true);
    setNotFound(false);

    const q = query(collection(db, "clients"), where("telephone", "==", fullPhone));
    let firstSnapshot = true;

    unsubRef.current = onSnapshot(q, async (snap) => {
      // Snapshot vide depuis le cache IndexedDB = Firestore pas encore prêt, on attend le serveur
      if (snap.empty && snap.metadata.fromCache) return;

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
            logoShape: (m.logo_shape as "square" | "round") || "square",
            logoCircleUrl: (m.logo_circle_url as string) || undefined,
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

      // Préchargement : routes + données des pages marchand (affichage instantané au tap)
      router.prefetch("/profil");
      results.forEach(c => {
        router.prefetch(`/c/${c.marchandId}`);
        fetch(`/api/public/marchand/${c.marchandId}`)
          .then(r => (r.ok ? r.json() : null))
          .then(d => { if (d) try { sessionStorage.setItem(`wallio_m_${c.marchandId}`, JSON.stringify(d)); } catch { /* */ } })
          .catch(() => {});
      });

      // Détecter si un email existe déjà sur l'un des docs client
      const foundEmail = snap.docs.map(d => d.data().email as string | undefined).find(e => !!e) ?? "";
      setClientEmail2(foundEmail);

      // Agrège toutes les notifs de tous les marchands, triées par date desc
      const allNotifs: ClientNotif[] = [];
      const newNotifsMap = new Map<string, ClientNotif[]>();
      snap.docs.forEach(d => {
        const raw = d.data().notifs as ClientNotif[] | undefined;
        if (raw?.length) {
          newNotifsMap.set(d.id, raw);
          allNotifs.push(...raw);
        }
      });
      notifsMapRef.current = newNotifsMap;
      allNotifs.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
      const notifsTop = allNotifs.slice(0, 50);
      setNotifs(notifsTop);

      // Mise à jour du cache mémoire (retour instantané la prochaine fois)
      cardsCache = { phone: fullPhone, cards: results, prenom: p, nom: n, notifs: notifsTop };

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
      // Wallio user (pré-inscrit, pas encore de clients Firestore) → vérifier via wallio_users
      if (isWallioUser) {
        const res = await fetch("/api/client/verify-user-pin", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telephone: phone, pin: pinInput }),
        });
        const data = await res.json();
        if (data.ok) {
          localStorage.setItem(VERIFIED_KEY, "1");
          await loadCards(phone);
        } else {
          setPinError("Code incorrect. Réessayez."); setPinInput("");
        }
        setPinLoading(false); return;
      }
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

  // Marque les messages d'un commerce comme lus quand on ouvre son fil.
  async function markCommerceRead(marchandId: string) {
    const clientId = cards.find(c => c.marchandId === marchandId)?.clientId;
    if (!clientId) return;
    const arr = notifsMapRef.current.get(clientId);
    if (!arr || !arr.some(n => !n.read)) return;
    const updated = arr.map(n => ({ ...n, read: true }));
    notifsMapRef.current.set(clientId, updated);
    setNotifs(prev => prev.map(n => n.marchandId === marchandId ? { ...n, read: true } : n));
    try { await updateDoc(doc(db, "clients", clientId), { notifs: updated }); } catch { /* silent */ }
  }

  // Refresh silencieux du token FCM à chaque session (couvre les expirations de token)
  useEffect(() => {
    if (tokenRefreshedRef.current) return;
    if (cards.length === 0) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    tokenRefreshedRef.current = true;
    (async () => {
      try {
        const { registerFcmToken } = await import("@/lib/fcm");
        const freshToken = await registerFcmToken();
        if (!freshToken) return;
        const cachedToken = localStorage.getItem(FCM_CACHE_KEY);
        if (freshToken === cachedToken) return;
        await Promise.all(cards.map(c => updateDoc(doc(db, "clients", c.clientId), { fcm_token: freshToken })));
        localStorage.setItem(FCM_CACHE_KEY, freshToken);
        setCards(prev => prev.map(c => ({ ...c, hasFcmToken: true })));
      } catch { /* silent */ }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  // Charge l'email du client si pas encore connu quand on entre dans forgot_pin
  useEffect(() => {
    if (step !== "forgot_pin" || clientEmail !== null || !phone) return;
    getDocs(query(collection(db, "clients"), where("telephone", "==", phone)))
      .then(snap => {
        const found = snap.docs.map(d => d.data().email as string | undefined).find(e => !!e) ?? "";
        setClientEmail2(found);
      })
      .catch(() => setClientEmail2(""));
  }, [step, clientEmail, phone]);

  async function handleSendOtp() {
    if (!phone) return;
    setOtpLoading(true); setOtpError("");
    try {
      const res = await fetch("/api/client/request-pin-reset", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telephone: phone }),
      });
      const data = await res.json();
      if (!data.ok) { setOtpError("Erreur. Réessayez."); return; }
      if (data.method === "email") {
        setResetEmailMasked(data.emailMasked ?? "");
        setOtpCode("");
        setStep("reset_code");
      } else if (data.method === "dob") {
        setClientEmail2(""); // bascule sur le formulaire date de naissance
      }
    } catch { setOtpError("Erreur. Réessayez."); }
    finally { setOtpLoading(false); }
  }

  async function handleVerifyOtp() {
    if (otpCode.length !== 6 || !phone) return;
    setOtpLoading(true); setOtpError("");
    try {
      const res = await fetch("/api/client/verify-pin-reset", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telephone: phone, code: otpCode }),
      });
      const data = await res.json();
      if (data.ok) { setPinInput(""); setPinError(""); setStep("create_pin"); }
      else setOtpError(data.error ?? "Code incorrect. Réessayez.");
    } catch { setOtpError("Erreur. Réessayez."); }
    finally { setOtpLoading(false); }
  }

  async function handleVerifyDob(e: React.FormEvent) {
    e.preventDefault();
    if (!dobInput || !phone) return;
    setOtpLoading(true); setOtpError("");
    try {
      const res = await fetch("/api/client/verify-pin-reset", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telephone: phone, dob: dobInput }),
      });
      const data = await res.json();
      if (data.ok) { setPinInput(""); setPinError(""); setStep("create_pin"); }
      else setOtpError("Date de naissance incorrecte. Réessayez.");
    } catch { setOtpError("Erreur. Réessayez."); }
    finally { setOtpLoading(false); }
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
        const cachedEmail = localStorage.getItem("wallio_client_email");
        const result = await creerClient({
          prenom, nom, telephone: phone,
          date_naissance: dob || "",
          marchand_id: marchand.id,
          email: cachedEmail || undefined,
        });
        clientId = result.clientId;
        walletId = result.walletId;
        fetch("/api/admin/notify-new-client", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prenom, nom, marchandNom: marchand.nom }) }).catch(() => {});
        // Sync FCM token si les notifs sont déjà activées sur cet appareil
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          import("@/lib/fcm").then(({ registerFcmToken }) =>
            registerFcmToken().then(token => {
              if (token) {
                updateDoc(doc(db, "clients", result.clientId), { fcm_token: token }).catch(() => {});
                localStorage.setItem(FCM_CACHE_KEY, token);
              }
            })
          ).catch(() => {});
        }
        // Sync PIN + email depuis wallio_users vers le nouveau doc client
        fetch("/api/client/sync-user-pin", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telephone: phone }),
        }).catch(() => {});
        // Email de bienvenue
        if (cachedEmail) {
          fetch("/api/send-welcome-email", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cachedEmail, prenom, marchandNom: marchand.nom, walletId, mode: "inscription" }),
          }).catch(() => {});
        }
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

  // Déconnexion et suppression de compte vivent désormais dans /profil.

  // ── Loading ────────────────────────────────────────────────────────
  // Pas de spinner si des cartes sont déjà affichées (retour depuis le cache)
  if ((step === "loading" || fetching) && cards.length === 0) return (
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
                <button onClick={() => { setOtpError(""); setOtpCode(""); setDobInput(""); setStep("forgot_pin"); }}
                  style={{ color: "#5B7CFA", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: 0 }}>
                  Réinitialiser
                </button>
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

  if (step === "forgot_pin") return (
    <main style={bg}>
      <div style={{ padding: "20px 20px 0", maxWidth: 430, margin: "0 auto", width: "100%" }}><Header /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px 48px" }}>
        <div style={{ maxWidth: 390, width: "100%", margin: "0 auto" }}>
          <div style={{ ...glass, padding: "32px 28px", borderRadius: 28, marginBottom: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, color: "#1C2333", marginBottom: 8 }}>Réinitialiser le PIN</h1>

            {clientEmail === null && (
              <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid rgba(91,124,250,0.3)", borderTopColor: "#5B7CFA", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {clientEmail !== null && clientEmail !== "" && (
              <>
                <p style={{ fontSize: 14, color: "#8E9BB5", marginBottom: 24, lineHeight: 1.55 }}>
                  Un code de vérification sera envoyé à <strong style={{ color: "#1C2333" }}>{resetEmailMasked || (clientEmail.split("@")[0][0] + "***@" + clientEmail.split("@")[1])}</strong>.
                </p>
                {otpError && <p style={{ fontSize: 13, color: "#FF453A", marginBottom: 12 }}>{otpError}</p>}
                <button onClick={handleSendOtp} disabled={otpLoading} style={{
                  width: "100%", padding: "15px", borderRadius: 16, border: "none",
                  background: otpLoading ? "rgba(142,155,181,0.15)" : "linear-gradient(135deg,#5B7CFA,#7C5BFA)",
                  color: otpLoading ? "#8E9BB5" : "white", fontSize: 15, fontWeight: 600, cursor: "pointer",
                  boxShadow: otpLoading ? "none" : "0 8px 24px rgba(91,124,250,0.35)", transition: "all 0.2s",
                }}>
                  {otpLoading ? "Envoi…" : "Envoyer le code par email"}
                </button>
              </>
            )}

            {clientEmail !== null && clientEmail === "" && (
              <form onSubmit={handleVerifyDob} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 14, color: "#8E9BB5", marginBottom: 8, lineHeight: 1.55 }}>
                  Entrez votre date de naissance pour vérifier votre identité.
                </p>
                <input
                  type="date" value={dobInput} onChange={e => setDobInput(e.target.value)}
                  required autoFocus
                  style={{ ...input, fontSize: 15 }}
                  onFocus={e => (e.target.style.borderColor = "#5B7CFA")}
                  onBlur={e => (e.target.style.borderColor = "rgba(142,155,181,0.25)")}
                />
                {otpError && <p style={{ fontSize: 13, color: "#FF453A" }}>{otpError}</p>}
                <button type="submit" disabled={!dobInput || otpLoading} style={{
                  padding: "15px", borderRadius: 16, border: "none",
                  background: dobInput && !otpLoading ? "linear-gradient(135deg,#5B7CFA,#7C5BFA)" : "rgba(142,155,181,0.15)",
                  color: dobInput && !otpLoading ? "white" : "#8E9BB5",
                  fontSize: 15, fontWeight: 600, cursor: "pointer",
                  boxShadow: dobInput && !otpLoading ? "0 8px 24px rgba(91,124,250,0.35)" : "none",
                  transition: "all 0.2s",
                }}>
                  {otpLoading ? "Vérification…" : "Vérifier"}
                </button>
              </form>
            )}
          </div>
          <button onClick={() => { setOtpError(""); setStep("pin"); }}
            style={{ display: "block", width: "100%", textAlign: "center", fontSize: 13, color: "#8E9BB5", background: "none", border: "none", cursor: "pointer", padding: "8px 0" }}>
            ← Retour
          </button>
        </div>
      </div>
    </main>
  );

  if (step === "reset_code") return (
    <main style={bg}>
      <div style={{ padding: "20px 20px 0", maxWidth: 430, margin: "0 auto", width: "100%" }}><Header /></div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px 48px" }}>
        <div style={{ maxWidth: 390, width: "100%", margin: "0 auto" }}>
          <div style={{ ...glass, padding: "32px 28px", borderRadius: 28, marginBottom: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4, color: "#1C2333", marginBottom: 8 }}>Code reçu ?</h1>
            <p style={{ fontSize: 14, color: "#8E9BB5", marginBottom: 24, lineHeight: 1.55 }}>
              Entrez le code à 6 chiffres envoyé à <strong style={{ color: "#1C2333" }}>{resetEmailMasked}</strong>.
            </p>
            <input
              type="tel" inputMode="numeric" pattern="\d{6}" maxLength={6}
              placeholder="123456" value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoFocus
              style={{ ...input, textAlign: "center", fontSize: 24, letterSpacing: "0.4em", fontWeight: 700, marginBottom: 12 }}
              onFocus={e => (e.target.style.borderColor = "#5B7CFA")}
              onBlur={e => (e.target.style.borderColor = "rgba(142,155,181,0.25)")}
            />
            {otpError && <p style={{ fontSize: 13, color: "#FF453A", marginBottom: 12 }}>{otpError}</p>}
            <button onClick={handleVerifyOtp} disabled={otpCode.length !== 6 || otpLoading} style={{
              width: "100%", padding: "15px", borderRadius: 16, border: "none",
              background: otpCode.length === 6 && !otpLoading ? "linear-gradient(135deg,#5B7CFA,#7C5BFA)" : "rgba(142,155,181,0.15)",
              color: otpCode.length === 6 && !otpLoading ? "white" : "#8E9BB5",
              fontSize: 15, fontWeight: 600, cursor: "pointer",
              boxShadow: otpCode.length === 6 && !otpLoading ? "0 8px 24px rgba(91,124,250,0.35)" : "none",
              transition: "all 0.2s",
            }}>
              {otpLoading ? "Vérification…" : "Vérifier"}
            </button>
            <button onClick={handleSendOtp} disabled={otpLoading}
              style={{ display: "block", width: "100%", textAlign: "center", fontSize: 13, color: "#5B7CFA", background: "none", border: "none", cursor: "pointer", padding: "12px 0 0", fontWeight: 600 }}>
              Renvoyer le code
            </button>
          </div>
          <button onClick={() => { setOtpError(""); setOtpCode(""); setStep("forgot_pin"); }}
            style={{ display: "block", width: "100%", textAlign: "center", fontSize: 13, color: "#8E9BB5", background: "none", border: "none", cursor: "pointer", padding: "8px 0" }}>
            ← Retour
          </button>
        </div>
      </div>
    </main>
  );

  if (step === "pin") return pinScreen(
    "Votre code PIN",
    "Entrez votre code à 4 chiffres pour accéder à vos cartes.",
    "Continuer",
    handleVerifyPin
  );

  if (step === "create_pin") return pinScreen(
    "Créez votre code PIN",
    "Wallio protège votre compte. Choisissez un code à 4 chiffres — vous n'aurez à le saisir qu'une seule fois par appareil.",
    "Créer mon code",
    handleCreatePin
  );

  // ── Login ──────────────────────────────────────────────────────────
  if (step === "login") return (
    <main style={{ ...bg, justifyContent: "center" }}>
      <div style={{ maxWidth: 380, width: "100%", margin: "0 auto", padding: "0 26px", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Logo + halo */}
        <div style={{ position: "relative", marginBottom: 30, display: "flex", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: 210, height: 210, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(123,92,246,0.34), rgba(47,123,255,0.16) 45%, transparent 70%)", filter: "blur(28px)", pointerEvents: "none" }} />
          <img src="/wallio-instagram-profil.png" alt="Wallio" style={{ position: "relative", width: 96, height: 96, borderRadius: 24, boxShadow: "0 14px 36px rgba(99,102,241,0.28)" }} />
        </div>

        {/* Titre + sous-titre */}
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, color: "#1C2333", textAlign: "center", lineHeight: 1.18 }}>
          Toutes vos cartes,<br />au même endroit.
        </h1>
        <p style={{ fontSize: 15, color: "#8E9BB5", textAlign: "center", lineHeight: 1.5, marginTop: 12, maxWidth: 320 }}>
          Entrez votre numéro pour retrouver vos cartes et découvrir de nouveaux établissements.
        </p>

        {/* Formulaire */}
        <form onSubmit={handleLogin} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, marginTop: 30 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
              style={{ flexShrink: 0, width: 118, height: 54, borderRadius: 15, background: "#F1F2F6", border: "1px solid #E3E5EC", padding: "0 12px", fontSize: 16, fontWeight: 500, color: "#1C2333", appearance: "none", WebkitAppearance: "none", outline: "none" }}>
              {PAYS.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <input type="tel" inputMode="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
              placeholder="6 12 34 56 78" required
              style={{ flex: 1, height: 54, borderRadius: 15, background: "#F1F2F6", border: "1px solid #E3E5EC", padding: "0 16px", fontSize: 16, color: "#1C2333", outline: "none" }}
              onFocus={e => (e.currentTarget.style.borderColor = "#2F7BFF")}
              onBlur={e => (e.currentTarget.style.borderColor = "#E3E5EC")} />
          </div>
          {notFound && <p style={{ fontSize: 13, color: "#FF453A", textAlign: "center" }}>{t.mes_cartes_not_found}</p>}
          <button type="submit" disabled={!phoneInput.trim()}
            style={{ height: 54, borderRadius: 16, border: "none", cursor: phoneInput.trim() ? "pointer" : "default", background: "linear-gradient(135deg,#2F7BFF,#8B5CF6)", color: "#fff", fontSize: 16, fontWeight: 600, opacity: phoneInput.trim() ? 1 : 0.4, boxShadow: phoneInput.trim() ? "0 10px 26px rgba(99,102,241,0.33)" : "none", transition: "opacity .2s, box-shadow .2s", marginTop: 4 }}>
            {t.mes_cartes_see}
          </button>
        </form>

        {/* Créer un compte */}
        <p style={{ fontSize: 14, color: "#8E9BB5", textAlign: "center", marginTop: 24 }}>
          {t.mes_cartes_no_card}{" "}
          <a href="/inscription" style={{ color: "#4B4FD6", fontWeight: 600, textDecoration: "none" }}>{t.mes_cartes_create}</a>
        </p>
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
          </div>
          <Link href="/profil" aria-label="Profil" style={{ width: 40, height: 40, borderRadius: "50%", background: "#EDE9FB", border: "1px solid rgba(123,97,214,0.18)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", flexShrink: 0 }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#6D4FC0" }}>{(prenom?.[0] || "?").toUpperCase()}</span>
          </Link>
        </div>

        {/* Tabs — indicateur unique qui glisse */}
        <div style={{ position: "relative", display: "flex", padding: "5px", background: "rgba(142,155,181,0.12)", borderRadius: 18, marginBottom: 20, backdropFilter: "blur(8px)" }}>
          <div className="tab-indicator" aria-hidden style={{
            position: "absolute", top: 5, bottom: 5, left: 5, width: "calc((100% - 10px) / 4)", borderRadius: 13,
            background: "white", boxShadow: "0 2px 12px rgba(100,120,160,0.15)", zIndex: 0,
            transform: `translateX(${["cartes", "messages", "map", "decouvrir"].indexOf(tab) * 100}%)`,
          }} />
          {(() => {
            const unread = notifs.filter(n => !n.read).length;
            return ([
              ["cartes", `Cartes (${cards.length})`, 0],
              ["messages", t.mes_cartes_tab_messages, unread],
              ["map", "Map", 0],
              ["decouvrir", t.mes_cartes_tab_discover, 0],
            ] as const).map(([key, label, badge]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                position: "relative", zIndex: 1, flex: 1, padding: "10px 4px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5, whiteSpace: "nowrap",
                background: "transparent",
                color: tab === key ? "#1C2333" : "#8E9BB5",
                transition: "color 0.2s",
              }}>
                {label}
                {badge > 0 && (
                  <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, background: "#9E8BD6", color: "white", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>
                )}
              </button>
            ));
          })()}
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

        <div key={tab} className="tab-fade" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
            // Récompenses prêtes d'abord, puis restants croissants.
            const byReward = (a: CardData, b: CardData) => {
              const ra = cardRestants(a).restants, rb = cardRestants(b).restants;
              const readyA = ra <= 0 ? 0 : 1, readyB = rb <= 0 ? 0 : 1;
              if (readyA !== readyB) return readyA - readyB;
              return ra - rb;
            };
            // Regroupement par ville
            const groups: Record<string, CardData[]> = {};
            cards.forEach(c => { const k = c.ville || "Autres"; (groups[k] = groups[k] || []).push(c); });
            const villes = Object.keys(groups).sort((a, b) => a === "Autres" ? 1 : b === "Autres" ? -1 : a.localeCompare(b, "fr"));
            let i = -1;
            return villes.map(ville => (
              <div key={ville} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#8E9BB5", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 2 }}>{ville}</p>
                {[...groups[ville]].sort(byReward).map(card => { i++; return <CardItem key={card.walletId} card={card} delay={i * 0.06} />; })}
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
          ) : (() => {
            // Regroupe par commerce ; chaque groupe trié du plus récent au plus ancien.
            const groups = new Map<string, ClientNotif[]>();
            notifs.forEach(n => { const a = groups.get(n.marchandId) || []; a.push(n); groups.set(n.marchandId, a); });
            const list = [...groups.entries()].map(([mid, arr]) => {
              const sorted = [...arr].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
              return { mid, arr: sorted, last: sorted[0], unread: sorted.filter(n => !n.read).length, nom: sorted[0].marchandNom };
            }).sort((a, b) => b.last.sentAt.localeCompare(a.last.sentAt));

            return list.map(g => {
              const card = cards.find(c => c.marchandId === g.mid);
              const open = openMsgCommerce === g.mid;
              const d = new Date(g.last.sentAt);
              const dateStr = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
              const logo = (card?.logoShape === "round" && card?.logoCircleUrl) ? card.logoCircleUrl : card?.logoUrl;
              return (
                <div key={g.mid} style={{ ...glass, borderRadius: 20, overflow: "hidden" }}>
                  <button onClick={() => { const next = open ? null : g.mid; setOpenMsgCommerce(next); if (!open) markCommerceRead(g.mid); }}
                    style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", padding: "16px 18px", display: "flex", gap: 14, alignItems: "center" }}>
                    {logo ? (
                      <img src={logo} alt="" style={{ width: 40, height: 40, borderRadius: card?.logoShape === "round" ? "50%" : 12, objectFit: "contain", background: "rgba(142,155,181,0.1)", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: card?.couleur || "#5B7CFA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{g.nom[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: g.unread > 0 ? 600 : 500, color: "#1C2333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.nom}</p>
                        <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: "#8E9BB5" }}>{dateStr}</span>
                          {g.unread > 0 && <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: 9, background: "#9E8BD6", color: "white", fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{g.unread}</span>}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: "#6E7A8A", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: g.unread > 0 ? 600 : 400 }}>{g.last.title}</p>
                    </div>
                  </button>
                  {open && (
                    <div style={{ borderTop: "1px solid rgba(142,155,181,0.14)", display: "flex", flexDirection: "column" }}>
                      {g.arr.map(n => {
                        const nd = new Date(n.sentAt);
                        return (
                          <div key={n.id} style={{ padding: "12px 18px", borderBottom: "1px solid rgba(142,155,181,0.08)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#1C2333" }}>{n.title}</p>
                              <p style={{ fontSize: 11, color: "#8E9BB5", flexShrink: 0 }}>{nd.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} {nd.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                            <p style={{ fontSize: 13, color: "#6E7A8A", lineHeight: 1.45, marginTop: 3 }}>{n.body}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()
        )}

        {/* ── Tab Découvrir ── */}
        {tab === "decouvrir" && isWallioUser && cards.length === 0 && (
          <div style={{ background: "rgba(0,122,255,0.08)", border: "1px solid rgba(0,122,255,0.2)", borderRadius: 16, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{ fontSize: 13, color: "#007AFF", fontWeight: 500, margin: 0 }}>Rejoignez un prestataire ci-dessous pour activer votre carte.</p>
          </div>
        )}
        {tab === "decouvrir" && (() => {
          // Catégories réellement présentes (sur TOUS les marchands, pour que les filtres marchent aussi sur la carte)
          const catsPresent = Array.from(new Set(allMerchantsRef.current.map(m => m.categorie).filter(Boolean))) as string[];
          const filtered = merchants
            .filter(m => catFilter === "tous" || m.categorie === catFilter)
            .sort((a, b) => (a.ville || "zzz").localeCompare(b.ville || "zzz", "fr"));
          const now = Date.now() / 1000;

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#1C2333" }}>Par ville</p>

              {/* Filtres par catégorie */}
              {catsPresent.length > 0 && (
                <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2, WebkitOverflowScrolling: "touch" }}>
                  {["tous", ...catsPresent].map(c => (
                    <button key={c} onClick={() => setCatFilter(c)} style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 100, border: "1px solid " + (catFilter === c ? "transparent" : "rgba(142,155,181,0.25)"), cursor: "pointer", fontSize: 13, fontWeight: 600, background: catFilter === c ? "#6D4FC0" : "transparent", color: catFilter === c ? "white" : "#6E7A8A" }}>
                      {c === "tous" ? "Tous" : DISCOVER_CATS[c] || c}
                    </button>
                  ))}
                </div>
              )}

              {filtered.length === 0 ? (
                <div style={{ ...glass, padding: "40px 24px", borderRadius: 24, textAlign: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(52,199,89,0.10)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="1.8" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#1C2333", marginBottom: 6 }}>{t.mes_cartes_empty_discover}</p>
                  <p style={{ fontSize: 13, color: "#8E9BB5" }}>{t.mes_cartes_empty_discover_sub}</p>
                </div>
              ) : (() => {
                const groups: Record<string, typeof filtered> = {};
                filtered.forEach(mm => { const k = mm.ville || "Autres"; (groups[k] = groups[k] || []).push(mm); });
                const villes = Object.keys(groups).sort((a, b) => a === "Autres" ? 1 : b === "Autres" ? -1 : a.localeCompare(b, "fr"));
                let i = -1;
                return villes.map(ville => (
                  <div key={ville} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#8E9BB5", textTransform: "uppercase", letterSpacing: "0.08em", paddingLeft: 2 }}>{ville}</p>
                    {groups[ville].map(m => {
                      i++;
                      const isNew = m.dateInscription != null && (now - m.dateInscription) < 30 * 86400;
                      const sousTitre = [m.categorie ? DISCOVER_CATS[m.categorie] : "", m.ville].filter(Boolean).join(" · ");
                      return (
                  <div key={m.id} className="card-appear" onClick={() => router.push(`/c/${m.id}`)}
                    style={{ animationDelay: `${i * 0.05}s`, ...glass, borderRadius: 22, overflow: "hidden", cursor: "pointer" }}>
                    {/* Bannière + badge Nouveau */}
                    <div style={{ position: "relative", height: 92, background: m.banner ? `center/cover url(${m.banner})` : m.couleur }}>
                      {isNew && <span style={{ position: "absolute", top: 10, left: 10, padding: "3px 9px", borderRadius: 100, background: "rgba(255,255,255,0.92)", fontSize: 11, fontWeight: 700, color: "#1C2333" }}>Nouveau</span>}
                    </div>
                    <div style={{ padding: "0 16px 14px", position: "relative" }}>
                      {/* Logo qui chevauche */}
                      <div style={{ position: "absolute", top: -22, left: 16, width: 46, height: 46, borderRadius: 12, overflow: "hidden", border: "2px solid white", background: m.couleur, display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: m.logoUrl ? `url(${(m.logoShape === "round" && m.logoCircleUrl) ? m.logoCircleUrl : m.logoUrl})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
                        {!m.logoUrl && <span style={{ fontSize: 18, fontWeight: 700, color: "white" }}>{m.nom[0]?.toUpperCase()}</span>}
                      </div>
                      <div style={{ paddingTop: 30 }}>
                        <p style={{ fontSize: 16, fontWeight: 600, color: "#1C2333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.nom}</p>
                        {sousTitre && <p style={{ fontSize: 12, color: "#8E9BB5", marginTop: 1 }}>{sousTitre}</p>}
                      </div>
                      <div style={{ borderTop: "1px solid rgba(142,155,181,0.14)", marginTop: 12, paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontSize: 13, color: "#6E7A8A" }}>{m.objectif ? `${m.objectif} tampons → ${m.reward || "récompense"}` : "Programme de fidélité"}</span>
                        <button
                          onClick={e => { e.stopPropagation(); rejoindre(m); }}
                          disabled={joining.has(m.id) || joined.has(m.id)}
                          style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 11, border: "none", cursor: joining.has(m.id) ? "wait" : "pointer", background: joined.has(m.id) ? "rgba(52,199,89,0.12)" : "rgba(123,97,214,0.12)", color: joined.has(m.id) ? "#34C759" : "#4B4FD6", fontSize: 13, fontWeight: 600 }}>
                          {joining.has(m.id) ? "…" : joined.has(m.id) ? t.mes_cartes_joined : t.mes_cartes_join}
                        </button>
                      </div>
                      {!prenom && <p style={{ fontSize: 11, color: "#8E9BB5", textAlign: "center", marginTop: 10 }}>{t.mes_cartes_nfc_required}</p>}
                    </div>
                  </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          );
        })()}

        {/* ── Tab Map ── */}
        {tab === "map" && (() => {
          const catsPresent = Array.from(new Set(allMerchantsRef.current.map(m => m.categorie).filter(Boolean))) as string[];
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {catsPresent.length > 0 && (
                <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 2, WebkitOverflowScrolling: "touch" }}>
                  {["tous", ...catsPresent].map(c => (
                    <button key={c} onClick={() => setCatFilter(c)} style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 100, border: "1px solid " + (catFilter === c ? "transparent" : "rgba(142,155,181,0.25)"), cursor: "pointer", fontSize: 13, fontWeight: 600, background: catFilter === c ? "#6D4FC0" : "transparent", color: catFilter === c ? "white" : "#6E7A8A" }}>
                      {c === "tous" ? "Tous" : DISCOVER_CATS[c] || c}
                    </button>
                  ))}
                </div>
              )}
              <DiscoverMap
                merchants={allMerchantsRef.current.filter(mm => catFilter === "tous" || mm.categorie === catFilter)}
                registeredIds={registeredIdsRef.current}
                onJoin={rejoindre}
              />
            </div>
          );
        })()}
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "#B0BAD0", paddingBottom: 8, paddingTop: 8 }}>{t.mes_cartes_footer}</p>
      <div style={{ height: "max(48px, env(safe-area-inset-bottom, 48px))" }} />
    </main>
  );
}

function cardRestants(card: CardData): { restants: number; reward: string; objectif: number } {
  let objectif = card.stampsObjective;
  let reward = card.rewardName;
  if (card.modeRecompense === "progressif" && card.paliers?.length) {
    const pv = card.paliersValides || [];
    const prochain = card.paliers.find((p, i) => !pv[i]) ?? card.paliers[card.paliers.length - 1];
    objectif = prochain.tampons;
    reward = prochain.recompense;
  }
  return { restants: Math.max(0, objectif - card.stampsCurrent), reward, objectif };
}

function CardItem({ card, delay }: { card: CardData; delay: number }) {
  const { restants, reward, objectif } = cardRestants(card);
  const pct = Math.min(100, Math.round((card.stampsCurrent / objectif) * 100));
  const ready = restants <= 0;
  const dark = isColorDark(card.couleur);

  return (
    <Link href={`/c/${card.marchandId}`} className="card-appear" style={{ display: "block", textDecoration: "none", animationDelay: `${delay}s`, borderRadius: 24, overflow: "hidden", boxShadow: "0 12px 40px rgba(100,120,160,0.18)" }}>
      {/* Haut coloré — inchangé : logo, nom, compteur, barre */}
      <div style={{ background: card.couleur, padding: "20px 20px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {card.logoUrl
              ? <img src={card.logoUrl} alt="" style={{ height: 32, width: 32, borderRadius: card.logoShape === "round" ? "50%" : 9, objectFit: "contain", background: "rgba(255,255,255,0.15)" }} />
              : <div style={{ height: 32, width: 32, borderRadius: card.logoShape === "round" ? "50%" : 9, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: dark ? "white" : "#1C2333" }}>{card.marchandNom[0]?.toUpperCase()}</span>
                </div>
            }
            <span style={{ fontSize: 15, fontWeight: 600, color: dark ? "white" : "#1C2333", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.marchandNom}</span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: dark ? "white" : "#1C2333", letterSpacing: -0.5 }}>
            {card.stampsCurrent}<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.55 }}>/{objectif}</span>
          </span>
        </div>
        <div style={{ height: 5, background: "rgba(255,255,255,0.2)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 10, background: dark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.45)", transition: "width 0.8s cubic-bezier(.16,1,.3,1)" }} />
        </div>
      </div>

      {/* Ligne du bas : à gauche l'état, à droite la récompense */}
      <div style={{ background: "#fff", padding: "13px 18px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          {ready ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: card.couleur }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
              Récompense prête
            </span>
          ) : (
            <span style={{ fontSize: 13, color: "#6E7A8A" }}>{card.stampsCurrent === 0 ? "Première visite" : `Encore ${restants} tampon${restants > 1 ? "s" : ""}`}</span>
          )}
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1C2333", textAlign: "right", maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reward}</span>
        </div>
        {IS_IOS && !card.hasPushToken && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(142,155,181,0.14)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0556A" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/></svg>
            <span style={{ fontSize: 12, color: "#C0556A" }}>Pas dans votre Wallet · appuyez pour l&apos;ajouter</span>
          </div>
        )}
      </div>
    </Link>
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
