"use client";

import { useEffect, useState, useCallback, use, lazy, Suspense } from "react";
import Link from "next/link";
import {
  getMarchandByNfcId,
  getClientByWalletId, getClientByTelephone, getWalletClientByTelephone,
  creerClient, ajouterTampon, checkEtRecompenseParrain,
  formatTemps, WALLET_KEY, setClientEmail,
  type Marchand, type Client, type TamponResult,
} from "@/lib/loyalty";
import { doc, updateDoc, getDocs, getDocsFromServer, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { registerFcmToken } from "@/lib/fcm";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import { getWalletLang } from "@/lib/wallet-lang";

// Lazy-load composants lourds — pas besoin au premier rendu
const AppleWalletCard = lazy(() => import("@/components/AppleWalletCard"));
const GoogleWalletCard = lazy(() => import("@/components/GoogleWalletCard"));
const PasskeyRegisterBanner = lazy(() => import("@/components/PasskeyRegisterBanner"));

type Screen =
  | { type: "loading" }
  | { type: "result"; result: TamponResult; client: Client; marchand: Marchand }
  | { type: "inscription"; marchand: Marchand; refParam: string | null }
  | { type: "passkey_prompt"; marchand: Marchand; refParam: string | null }
  | { type: "recuperation"; marchand: Marchand }
  | { type: "carte"; client: Client; marchand: Marchand; recuperation?: boolean; parraine?: boolean }
  | { type: "lien_parrainage"; marchand: Marchand }
  | { type: "erreur"; message: string };

function setCookiePhone(phone: string) {
  const exp = new Date();
  exp.setFullYear(exp.getFullYear() + 1);
  document.cookie = `wallio_p=${encodeURIComponent(phone)}; expires=${exp.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookiePhone(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)wallio_p=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function NfcPage({ params }: { params: Promise<{ marchandId: string }> }) {
  const { marchandId } = use(params);
  const [screen, setScreen] = useState<Screen>({ type: "loading" });
  useTimeTheme("light"); // page NFC toujours en mode clair
  useAutoRefresh(screen.type === "loading");

  // Polling quand le client attend un choix — se met à jour si le barista choisit pour lui
  const choixRequisKey = screen.type === "result" && screen.result.type === "choix_requis"
    ? screen.client.wallet_id : null;
  useEffect(() => {
    if (!choixRequisKey || screen.type !== "result" || screen.result.type !== "choix_requis") return;
    const wId = screen.client.wallet_id;
    const mId = screen.marchand.id;
    const mn = screen.marchand as Record<string, unknown>;
    const id = setInterval(async () => {
      try {
        const snap = await getDocsFromServer(query(collection(db, "clients"), where("wallet_id", "==", wId), where("marchand_id", "==", mId)));
        const fresh = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as import("@/lib/loyalty").Client;
        if (!fresh || fresh.choix_en_attente) return;
        clearInterval(id);
        if (fresh.choix_fait === "petit") {
          setScreen({ type: "result", result: { type: "recompense", prenom: fresh.prenom, nom_recompense: (mn.nom_recompense_petit as string) || "", tampons: fresh.tampons }, client: { ...fresh, choix_fait: "petit" }, marchand: screen.marchand });
        } else if (fresh.choix_fait === "grand") {
          setScreen({ type: "result", result: { type: "ok", prenom: fresh.prenom, tampons: fresh.tampons, objectif: (mn.objectif_tampons as number) || 10, prochainRecompense: (mn.nom_recompense_grand as string) || "" }, client: { ...fresh, choix_fait: "grand" }, marchand: screen.marchand });
        }
      } catch { /* silent */ }
    }, 3000);
    return () => clearInterval(id);
  }, [choixRequisKey]); // eslint-disable-line

  const traiterTampon = useCallback(async (client: Client, marchand: Marchand) => {
    const result = await ajouterTampon(client, marchand);
    setScreen({ type: "result", result, client, marchand });
    try { sessionStorage.setItem(`nfc_result_${marchand.id}`, JSON.stringify({ result, client })); } catch {}
    try { localStorage.setItem(`nfc_dead_${marchand.id}`, JSON.stringify({ ts: Date.now(), type: "result", result, client })); } catch {}
    if (result.type === "ok" || result.type === "recompense" || result.type === "choix_requis") {
      try { navigator.vibrate(result.type === "recompense" ? [80, 60, 120] : result.type === "choix_requis" ? [60, 40, 60] : 40); } catch {}
      const body = JSON.stringify({ walletId: client.wallet_id });
      const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
      fetch("/api/apple-wallet/push-update", opts).catch(() => {});
      fetch("/api/google-wallet/push-update", opts).catch(() => {});
      // Vérifie si ce tampon déclenche la récompense parrain (1ère vraie visite du filleul)
      checkEtRecompenseParrain(client, marchand.id).then(res => {
        if (!res) return;
        const b = JSON.stringify({ walletId: res.walletId });
        const o = { method: "POST", headers: { "Content-Type": "application/json" }, body: b };
        fetch("/api/apple-wallet/push-update", o).catch(() => {});
        fetch("/api/google-wallet/push-update", o).catch(() => {});
        fetch("/api/notify-parrainage", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parrainWalletId: res.walletId, filleulPrenom: client.prenom, filleulNom: client.nom, type: "visite", recompense: res.recompense, marchandId: marchand.id, marchandNom: marchand.nom }),
        }).catch(() => {});
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const CACHE_KEY = `wm_${marchandId}`;
        const CACHE_TTL = 4 * 60 * 60 * 1000; // 4h
        let marchand: Marchand | null = null;
        try {
          const raw = localStorage.getItem(CACHE_KEY);
          if (raw) {
            const { d, ts } = JSON.parse(raw);
            if (Date.now() - ts < CACHE_TTL) marchand = d;
          }
        } catch {}
        if (!marchand) {
          marchand = await getMarchandByNfcId(marchandId);
          if (marchand) try { localStorage.setItem(CACHE_KEY, JSON.stringify({ d: marchand, ts: Date.now() })); } catch {}
        }
        if (!marchand || !marchand.actif) {
          setScreen({ type: "erreur", message: "Ce service est temporairement indisponible." });
          return;
        }

        // Dead flag — back_forward/reload → afficher résultat en cache, jamais de re-tampon
        const navType = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type;
        if (navType !== "navigate") {
          try {
            const deadRaw = localStorage.getItem(`nfc_dead_${marchand.id}`);
            if (deadRaw) {
              const dead = JSON.parse(deadRaw) as { ts: number; type: "result" | "carte"; result?: TamponResult; client: Client; parraine?: boolean; recuperation?: boolean };
              if (Date.now() - dead.ts < 24 * 60 * 60 * 1000) {
                if (dead.type === "result" && dead.result) {
                  setScreen({ type: "result", result: dead.result, client: dead.client, marchand });
                } else {
                  setScreen({ type: "carte", client: dead.client, marchand, parraine: dead.parraine, recuperation: dead.recuperation });
                }
                return;
              }
              localStorage.removeItem(`nfc_dead_${marchand.id}`);
            }
          } catch {}
          // Backup sessionStorage (même session)
          try {
            const stored = sessionStorage.getItem(`nfc_result_${marchand.id}`);
            if (stored) {
              const { result, client } = JSON.parse(stored) as { result: TamponResult; client: Client };
              setScreen({ type: "result", result, client, marchand });
              return;
            }
          } catch {}
        }

        // Lire le paramètre de parrainage depuis l'URL
        const ref = new URLSearchParams(window.location.search).get("ref");
        const parrainageActif = !!(marchand as Record<string, unknown>).parrainage_actif;

        const walletId = localStorage.getItem(WALLET_KEY(marchandId));
        let compteSupprimeIci = false;

        if (walletId) {
          const client = await getClientByWalletId(walletId, marchand.id);
          if (client) {
            // Lien de parrainage → client existant ici : pas de tampon, juste un message
            if (ref && parrainageActif) {
              setScreen({ type: "lien_parrainage", marchand });
              return;
            }
            // Si ce client n'est pas dans Apple/Google Wallet, chercher le bon par téléphone
            const hasWallet = client.apns_push_token || client.wallet_type;
            if (!hasWallet && client.telephone) {
              const walletClient = await getWalletClientByTelephone(client.telephone, marchand.id);
              if (walletClient && walletClient.wallet_id !== walletId) {
                localStorage.setItem(WALLET_KEY(marchandId), walletClient.wallet_id);
                await traiterTampon(walletClient, marchand);
                return;
              }
            }
            await traiterTampon(client, marchand);
            return;
          }
          // wallet_id présent en local mais compte supprimé → on nettoie
          localStorage.removeItem(WALLET_KEY(marchandId));
          compteSupprimeIci = true;
        }

        // Identité Wallio connue → inscription automatique chez un NOUVEAU marchand
        // (skip si le compte a été explicitement supprimé chez CE marchand)
        const cachedPhone  = localStorage.getItem("wallio_client_phone");
        const cachedPrenom = localStorage.getItem("wallio_client_prenom");
        const cachedNom    = localStorage.getItem("wallio_client_nom");
        const cachedDob    = localStorage.getItem("wallio_client_dob");
        if (cachedPhone && cachedPrenom && cachedNom && !compteSupprimeIci) {
          // Peut-être déjà inscrit ici (localStorage perdu / nouvel appareil)
          const existing = await getClientByTelephone(cachedPhone, marchand.id);
          if (existing) {
            // Déjà client ici → lien parrainage : pas de tampon
            if (ref && parrainageActif) {
              setScreen({ type: "lien_parrainage", marchand });
              return;
            }
            localStorage.setItem(WALLET_KEY(marchandId), existing.wallet_id);
            setCookiePhone(cachedPhone);
            await traiterTampon(existing, marchand);
            return;
          }
          // Nouveau chez ce marchand → on crée la carte automatiquement
          const parrainId = parrainageActif && ref ? ref : undefined;
          const { clientId, walletId: newWalletId } = await creerClient({
            prenom: cachedPrenom, nom: cachedNom, telephone: cachedPhone,
            date_naissance: cachedDob || "", marchand_id: marchand.id,
            parrain_wallet_id: parrainId,
          });
          localStorage.setItem(WALLET_KEY(marchandId), newWalletId);
          const newClient: Client = {
            id: clientId, prenom: cachedPrenom, nom: cachedNom,
            telephone: cachedPhone, date_naissance: cachedDob || "",
            wallet_id: newWalletId, marchand_id: marchand.id,
            tampons: parrainId ? 1 : 0,
          };
          if (parrainId) {
            // Notif "rejoint" au parrain — son tampon viendra à la 1ère vraie visite de B
            fetch("/api/notify-parrainage", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ parrainWalletId: parrainId, filleulPrenom: cachedPrenom, filleulNom: cachedNom, type: "rejoint", marchandId: marchand.id, marchandNom: marchand.nom }),
            }).catch(() => {});
            setScreen({ type: "carte", client: { ...newClient, tampons: 1 }, marchand, parraine: true });
          } else {
            const result = await ajouterTampon(newClient, marchand);
            if (result.type === "ok" || result.type === "recompense") {
              const body = JSON.stringify({ walletId: newWalletId });
              const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
              fetch("/api/apple-wallet/push-update", opts).catch(() => {});
              fetch("/api/google-wallet/push-update", opts).catch(() => {});
            }
            setScreen({ type: "carte", client: { ...newClient, tampons: result.type === "ok" ? result.tampons : 1 }, marchand });
          }
          return;
        }

        // Fallback cookie — si localStorage vidé mais cookie présent → reconnexion silencieuse
        if (!compteSupprimeIci) {
          const cookiePhone = getCookiePhone();
          if (cookiePhone) {
            const existing = await getClientByTelephone(cookiePhone, marchand.id);
            if (existing) {
              localStorage.setItem(WALLET_KEY(marchandId), existing.wallet_id);
              localStorage.setItem("wallio_client_phone", existing.telephone);
              setCookiePhone(existing.telephone);
              await traiterTampon(existing, marchand);
              return;
            }
          }
        }

        // Passkey — dernier recours avant le formulaire d'inscription
        if (!compteSupprimeIci) {
          const { isPasskeySupported } = await import("@/lib/passkey-client");
          if (await isPasskeySupported()) {
            setScreen({ type: "passkey_prompt", marchand, refParam: parrainageActif ? ref : null });
            return;
          }
        }

        setScreen({ type: "inscription", marchand, refParam: parrainageActif ? ref : null });
      } catch (e) {
        setScreen({ type: "erreur", message: `Erreur de connexion. Réessayez. (${String(e).slice(0, 60)})` });
      }
    }
    init();
  }, [marchandId, traiterTampon]);

  if (screen.type === "loading") return <Loading />;
  if (screen.type === "erreur") return <Erreur message={screen.message} />;
  if (screen.type === "result") return (
    <ResultScreen
      result={screen.result}
      marchand={screen.marchand}
      walletId={screen.client.wallet_id}
      telephone={screen.client.telephone || ""}
      paliersValides={screen.client.paliers_valides || []}
      hasWallet={!!(screen.client.wallet_type || screen.client.apns_push_token)}
      hasFcmToken={!!screen.client.fcm_token}
      onEnregistrerChoix={async (choix) => {
        const res = await fetch("/api/nfc/enregistrer-choix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletId: screen.client.wallet_id, marchandId: screen.marchand.id, choix }),
        });
        const data = await res.json();
        if (data.already_done) {
          // Un autre côté a déjà enregistré le choix — ne rien afficher, le screen se mettra à jour via le prochain scan
          return;
        }
        if (data.ok) {
          const mn = screen.marchand as Record<string, unknown>;
          const tampons = screen.result.type === "choix_requis" ? screen.result.tampons : 0;
          if (choix === "petit") {
            setScreen({ type: "result", result: { type: "recompense", prenom: screen.client.prenom, nom_recompense: (mn.nom_recompense_petit as string) || "", tampons }, client: { ...screen.client, choix_fait: "petit" }, marchand: screen.marchand });
          } else {
            setScreen({ type: "result", result: { type: "ok", tampons, objectif: (mn.objectif_tampons as number) || 0, prenom: screen.client.prenom }, client: { ...screen.client, choix_fait: "grand" }, marchand: screen.marchand });
          }
        }
      }}
    />
  );
  if (screen.type === "passkey_prompt") return (
    <PasskeyPromptScreen
      marchand={screen.marchand}
      onPasskey={async () => {
        setScreen({ type: "loading" });
        const { authenticateWithPasskey } = await import("@/lib/passkey-client");
        const telephone = await authenticateWithPasskey();
        if (!telephone) {
          setScreen({ type: "inscription", marchand: screen.marchand, refParam: screen.refParam });
          return;
        }
        const client = await getClientByTelephone(telephone, screen.marchand.id);
        if (!client) {
          // Passkey reconnue mais pas encore inscrit chez ce marchand → inscription auto
          localStorage.setItem("wallio_client_phone", telephone);
          setCookiePhone(telephone);
          setScreen({ type: "inscription", marchand: screen.marchand, refParam: screen.refParam });
          return;
        }
        localStorage.setItem(WALLET_KEY(marchandId), client.wallet_id);
        localStorage.setItem("wallio_client_phone", telephone);
        setCookiePhone(telephone);
        await traiterTampon(client, screen.marchand);
      }}
      onInscription={() => setScreen({ type: "inscription", marchand: screen.marchand, refParam: screen.refParam })}
      onRecuperation={() => setScreen({ type: "recuperation", marchand: screen.marchand })}
    />
  );
  if (screen.type === "inscription") return (
    <InscriptionForm
      marchand={screen.marchand}
      parrainWalletId={screen.refParam ?? undefined}
      onSuccess={async (client, isNew) => {
        localStorage.setItem(WALLET_KEY(marchandId), client.wallet_id);
        if (client.telephone)      { localStorage.setItem("wallio_client_phone", client.telephone); setCookiePhone(client.telephone); }
        if (client.prenom)         localStorage.setItem("wallio_client_prenom", client.prenom);
        if (client.nom)            localStorage.setItem("wallio_client_nom", client.nom);
        if (client.date_naissance) localStorage.setItem("wallio_client_dob", client.date_naissance);
        if (isNew && screen.refParam) {
          // Notif "rejoint" au parrain — tampon différé à la 1ère vraie visite
          fetch("/api/notify-parrainage", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ parrainWalletId: screen.refParam, filleulPrenom: client.prenom, filleulNom: client.nom, type: "rejoint", marchandId: screen.marchand.id, marchandNom: screen.marchand.nom }),
          }).catch(() => {});
          const parrainClient = { ...client, tampons: 1 };
          setScreen({ type: "carte", client: parrainClient, marchand: screen.marchand, parraine: true });
          try { localStorage.setItem(`nfc_dead_${screen.marchand.id}`, JSON.stringify({ ts: Date.now(), type: "carte", client: parrainClient, parraine: true })); } catch {}
        } else {
          const result = await ajouterTampon(client, screen.marchand);
          if (result.type === "ok" || result.type === "recompense" || result.type === "choix_requis") {
            const body = JSON.stringify({ walletId: client.wallet_id });
            const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
            fetch("/api/apple-wallet/push-update", opts).catch(() => {});
            fetch("/api/google-wallet/push-update", opts).catch(() => {});
          }
          const newClient = { ...client, tampons: result.type === "ok" ? result.tampons : 1 };
          setScreen({ type: "carte", client: newClient, marchand: screen.marchand });
          try { localStorage.setItem(`nfc_dead_${screen.marchand.id}`, JSON.stringify({ ts: Date.now(), type: "carte", client: newClient })); } catch {}
        }
      }}
      onRecuperation={() => setScreen({ type: "recuperation", marchand: screen.marchand })}
    />
  );
  if (screen.type === "recuperation") return (
    <RecuperationForm
      marchand={screen.marchand}
      onSuccess={(client) => {
        localStorage.setItem(WALLET_KEY(marchandId), client.wallet_id);
        if (client.telephone)      { localStorage.setItem("wallio_client_phone", client.telephone); setCookiePhone(client.telephone); }
        if (client.prenom)         localStorage.setItem("wallio_client_prenom", client.prenom);
        if (client.nom)            localStorage.setItem("wallio_client_nom", client.nom);
        if (client.date_naissance) localStorage.setItem("wallio_client_dob", client.date_naissance);
        setScreen({ type: "carte", client, marchand: screen.marchand, recuperation: true });
        try { localStorage.setItem(`nfc_dead_${screen.marchand.id}`, JSON.stringify({ ts: Date.now(), type: "carte", client, recuperation: true })); } catch {}
      }}
      onBack={() => setScreen({ type: "inscription", marchand: screen.marchand, refParam: null })}
    />
  );
  if (screen.type === "lien_parrainage") return <LienParrainage marchand={screen.marchand} />;
  if (screen.type === "carte") return <CarteCreee client={screen.client} marchand={screen.marchand} recuperation={screen.recuperation} parraine={screen.parraine} />;
  return null;
}

const NFC_BG = "#F0F4FF";

function isLightColor(hex: string): boolean {
  const h = (hex || "#007AFF").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = (hex || "#007AFF").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Loading ──────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Lecture de votre carte…",      delay: 0 },
  { label: "Connexion au service…",         delay: 2500 },
  { label: "Mise à jour de votre carte…",   delay: 5500 },
  { label: "Encore quelques secondes…",     delay: 9000 },
];

function Loading() {
  const [step, setStep] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((s, i) => {
      if (i === 0) return;
      timers.push(setTimeout(() => setStep(i), s.delay));
    });
    timers.push(setTimeout(() => setSlow(true), 12000));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-8" style={{ background: NFC_BG }}>
      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:.3;transform:scale(.85)} 50%{opacity:1;transform:scale(1)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Dots animés */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: "50%",
            background: "rgba(99,102,241,0.5)",
            animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      {/* Message courant */}
      <p key={step} style={{
        fontSize: 16, fontWeight: 600, color: "#3C3C43", textAlign: "center",
        animation: "fade-up 0.35s ease",
      }}>
        {STEPS[step].label}
      </p>

      {/* Barre de progression */}
      <div style={{ width: 180, height: 3, background: "rgba(99,102,241,0.12)", borderRadius: 4, marginTop: 20, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: "linear-gradient(90deg,#6366F1,#818CF8)",
          width: `${((step + 1) / STEPS.length) * 100}%`,
          transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>

      {/* Message connexion lente */}
      {slow && (
        <p style={{ marginTop: 20, fontSize: 13, color: "#AEAEB2", textAlign: "center", animation: "fade-up 0.4s ease" }}>
          Connexion lente — merci de patienter
        </p>
      )}
    </main>
  );
}

// ─── Erreur ───────────────────────────────────────────────────────────────────

function Erreur({ message }: { message: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: NFC_BG }}>
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(255,59,48,0.10)", border: "1.5px solid rgba(255,59,48,0.2)" }}>
          <span className="text-[24px] font-bold" style={{ color: "#FF3B30" }}>!</span>
        </div>
        <p className="text-[17px]" style={{ color: "#3C3C43" }}>{message}</p>
      </div>
    </main>
  );
}

// ─── Résultat tampon ──────────────────────────────────────────────────────────

function ResultScreen({ result, marchand, walletId, telephone, paliersValides, hasWallet, hasFcmToken, onEnregistrerChoix }: {
  result: TamponResult;
  marchand: Marchand;
  walletId: string;
  telephone: string;
  paliersValides: boolean[];
  hasWallet: boolean;
  hasFcmToken: boolean;
  onEnregistrerChoix?: (choix: "petit" | "grand") => Promise<void>;
}) {
  const mn = marchand as Record<string, unknown>;
  const paliersDef = (mn.paliers as { tampons: number; recompense: string }[]) || [];
  const isProgressif = mn.mode_recompense === "progressif" && paliersDef.length > 0;
  const tamponsPostScan = result.type === "ok" || result.type === "recompense" ? result.tampons : 0;
  const couleur = (mn.apple_bg_color as string) || marchand.couleur_principale || "#007AFF";
  const isLight = isLightColor(couleur);
  const badgeTextColor = isLight ? "#1D1D1F" : "#FFFFFF";
  const [isAndroid, setIsAndroid] = useState(false);
  const [notifState, setNotifState] = useState<"idle" | "granted" | "denied">("idle");
  const [enregistrantChoix, setEnregistrantChoix] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailDone, setEmailDone] = useState(false);
  const [pinExists, setPinExists] = useState<boolean | null>(null);
  const [pinPromptInput, setPinPromptInput] = useState("");
  const [pinPromptSending, setPinPromptSending] = useState(false);
  const [pinPromptDone, setPinPromptDone] = useState(false);

  const isChoixRequis = result.type === "choix_requis";

  useEffect(() => {
    if (telephone) {
      getDocs(query(collection(db, "clients"), where("telephone", "==", telephone)))
        .then(snap => {
          setEmailExists(snap.docs.some(d => !!(d.data().email)));
          setPinExists(snap.docs.some(d => !!(d.data().pin_hash)));
        }).catch(() => { setEmailExists(true); setPinExists(true); });
    }
  }, [telephone]);

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
    if (typeof Notification !== "undefined") {
      if (Notification.permission === "granted") setNotifState("granted");
      else if (Notification.permission === "denied") setNotifState("denied");
    }
    // Synchronise la couleur de l'UI Safari (Dynamic Island + barre bas) avec le fond de page
    const prev = document.querySelector('meta[name="theme-color"]')?.getAttribute("content") ?? "";
    const setTheme = (c: string) => {
      let m = document.querySelector('meta[name="theme-color"]');
      if (!m) { m = document.createElement("meta"); (m as HTMLMetaElement).name = "theme-color"; document.head.appendChild(m); }
      m.setAttribute("content", c);
    };
    setTheme(NFC_BG);
    return () => setTheme(prev);
  }, []);

  async function activerNotifs() {
    try {
      const token = await registerFcmToken();
      if (token) {
        const snap = await getDocs(query(collection(db, "clients"), where("wallet_id", "==", walletId)));
        await Promise.all(snap.docs.map(d => updateDoc(d.ref, { fcm_token: token })));
        setNotifState("granted");
      } else {
        setNotifState("denied");
      }
    } catch { setNotifState("denied"); }
  }

  if (result.type === "not_found") return <Erreur message="Client introuvable." />;

  const isOk = result.type === "ok";
  const isRecompense = result.type === "recompense";
  const isAntiDoublon = result.type === "anti_doublon";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: `linear-gradient(180deg, ${hexToRgba(couleur, 0.06)} 0%, ${NFC_BG} 40%)` }}>
      <div className="w-full max-w-[360px] text-center">

        {/* Mini header commerçant */}
        <div className="flex flex-col items-center mb-8">
          {mn.logo_url ? (
            <img src={mn.logo_url as string} alt={marchand.nom}
              className="w-12 h-12 rounded-xl mb-2.5 object-cover"
              style={{ boxShadow: `0 4px 16px ${hexToRgba(couleur, 0.25)}` }} />
          ) : (
            <div className="w-12 h-12 rounded-xl mb-2.5 flex items-center justify-center text-[20px] font-bold"
              style={{ background: couleur, color: badgeTextColor, boxShadow: `0 4px 16px ${hexToRgba(couleur, 0.25)}` }}>
              {marchand.nom.charAt(0).toUpperCase()}
            </div>
          )}
          <p className="text-[15px] font-semibold" style={{ color: "#1D1D1F" }}>{marchand.nom}</p>
        </div>

        {/* Badge icône */}
        {isOk && (
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ background: couleur, boxShadow: `0 8px 24px ${hexToRgba(couleur, 0.35)}`, animation: "success-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <span className="text-[22px] font-bold" style={{ color: badgeTextColor }}>+{(result.double || result.birthday) ? "2" : "1"}</span>
          </div>
        )}
        {isRecompense && (
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ background: couleur, boxShadow: `0 8px 24px ${hexToRgba(couleur, 0.35)}`, animation: "success-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <span className="text-[22px] font-bold" style={{ color: badgeTextColor }}>+1</span>
          </div>
        )}
        {isAntiDoublon && (
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,159,10,0.12)", border: "1.5px solid rgba(255,159,10,0.28)", animation: "shake 0.45s ease-in-out" }}>
            <span className="text-[28px] font-bold leading-none" style={{ color: "#FF9F0A" }}>!</span>
          </div>
        )}
        {isChoixRequis && (
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,rgba(0,122,255,0.12),rgba(139,92,246,0.12))", animation: "success-pop 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="url(#ncg)">
              <defs><linearGradient id="ncg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#007AFF"/><stop offset="100%" stopColor="#8B5CF6"/></linearGradient></defs>
              <polyline points="20 12 20 22 4 22 4 12"/>
              <rect x="2" y="7" width="20" height="5"/>
              <line x1="12" y1="22" x2="12" y2="7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          </div>
        )}

        {/* Titre */}
        <h1 className="text-[26px] font-semibold tracking-tight mb-2" style={{ color: "#1D1D1F" }}>
          {isOk && (result.birthday ? "Joyeux anniversaire !" : result.double ? "2 tampons ajoutés" : "Tampon ajouté")}
          {isRecompense && "Récompense débloquée"}
          {isAntiDoublon && "Votre passage a déjà été enregistré"}
          {isChoixRequis && "À vous de choisir !"}
        </h1>

        {/* Sous-titre */}
        <p className="text-[16px] mb-6" style={{ color: "#6E6E73" }}>
          {isOk && `Bonjour ${result.prenom}`}
          {isRecompense && `Bonjour ${result.prenom} — ${result.nom_recompense}`}
          {isAntiDoublon && `À bientôt chez ${marchand.nom} !`}
          {isChoixRequis && `Bonjour ${result.prenom} — ${result.tampons} tampons`}
        </p>

        {/* Message anniversaire sur choix_requis */}
        {isChoixRequis && result.type === "choix_requis" && result.birthday && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-center"
            style={{ background: "rgba(255,45,85,0.07)", border: "1px solid rgba(255,45,85,0.18)" }}>
            <p className="text-[13px] font-semibold" style={{ color: "#FF2D55" }}>
              Joyeux anniversaire !{result.birthday_offre ? ` — ${result.birthday_offre}` : ""}
            </p>
          </div>
        )}

        {/* Bloc de choix Flex */}
        {isChoixRequis && result.type === "choix_requis" && (
          <div className="mb-6 rounded-2xl p-5 text-left" style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <p className="text-[13px] font-semibold uppercase tracking-widest mb-4" style={{ color: "#AEAEB2" }}>Votre choix</p>
            <div className="flex flex-col gap-3">
              <button
                disabled={enregistrantChoix}
                onClick={async () => {
                  if (!onEnregistrerChoix) return;
                  setEnregistrantChoix(true);
                  try { await onEnregistrerChoix("petit"); } finally { setEnregistrantChoix(false); }
                }}
                className="w-full py-4 rounded-2xl font-bold text-white text-[16px]"
                style={{ background: enregistrantChoix ? "#C7C7CC" : "linear-gradient(135deg,#007AFF,#8B5CF6)", border: "none", cursor: "pointer", boxShadow: enregistrantChoix ? "none" : "0 6px 20px rgba(0,122,255,0.25)" }}
              >
                {enregistrantChoix ? "…" : `Prendre : ${result.nom_recompense_petit}`}
              </button>
              <button
                disabled={enregistrantChoix}
                onClick={async () => {
                  if (!onEnregistrerChoix) return;
                  setEnregistrantChoix(true);
                  try { await onEnregistrerChoix("grand"); } finally { setEnregistrantChoix(false); }
                }}
                className="w-full py-3.5 rounded-2xl font-semibold text-[15px]"
                style={{ background: "rgba(0,0,0,0.04)", color: "#3C3C43", border: "1px solid rgba(0,0,0,0.08)", cursor: "pointer" }}
              >
                {`Continuer vers : ${result.nom_recompense_grand}`}
              </button>
            </div>
            <p className="text-[11px] mt-3 text-center" style={{ color: "#AEAEB2" }}>Ce choix est définitif</p>
          </div>
        )}

        {/* Offre anniversaire personnalisée */}
        {(isOk || isRecompense) && result.birthday && result.birthday_offre && (
          <div className="mb-5 px-4 py-3 rounded-2xl text-center"
            style={{ background: "rgba(255,45,85,0.07)", border: "1px solid rgba(255,45,85,0.18)" }}>
            <p className="text-[13px] font-semibold" style={{ color: "#FF2D55" }}>
              Offre anniversaire : {result.birthday_offre}
            </p>
          </div>
        )}

        {/* Barre de progression (ok) */}
        {isOk && (
          <div className="mb-6">
            {result.birthday && (
              <p className="text-[12px] font-medium mb-3 px-3 py-1.5 rounded-full inline-block"
                style={{ background: "rgba(255,45,85,0.08)", color: "#FF2D55" }}>
                Bonus anniversaire — 2 tampons offerts
              </p>
            )}
            {result.double && (
              <p className="text-[12px] font-medium mb-3 px-3 py-1.5 rounded-full inline-block"
                style={{ background: "rgba(0,122,255,0.08)", color: "#007AFF" }}>
                Offre x2 tampons active
              </p>
            )}
            <div className="flex justify-between text-[12px] mb-2" style={{ color: "#AEAEB2" }}>
              <span>{result.tampons} tampon{result.tampons > 1 ? "s" : ""}</span>
              <span>Objectif {result.objectif}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E5E5EA" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min((result.tampons / result.objectif) * 100, 100)}%`, background: couleur }} />
            </div>
            {result.tampons < result.objectif && (
              <p className="text-[12px] mt-2" style={{ color: "#AEAEB2" }}>
                {result.objectif - result.tampons} avant {result.prochainRecompense || marchand.nom_recompense}
              </p>
            )}
          </div>
        )}

        {/* Explication programme Flex */}
        {isOk && mn.mode_recompense === "flex" && (
          <div className="rounded-2xl p-4 mb-5 text-left" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#AEAEB2" }}>Programme Flex</p>
            {result.objectif === (mn.palier_intermediaire as number) ? (
              <>
                <p className="text-[13px] font-medium mb-2" style={{ color: "#1D1D1F" }}>
                  À {mn.palier_intermediaire as number} tampons, vous choisissez :
                </p>
                <p className="text-[12px] mb-1" style={{ color: "#6E6E73" }}>· Prendre {mn.nom_recompense_petit as string}</p>
                <p className="text-[12px]" style={{ color: "#6E6E73" }}>· Ou continuer jusqu&apos;à {marchand.objectif_tampons} tampons pour {mn.nom_recompense_grand as string}</p>
              </>
            ) : (
              <p className="text-[13px] font-medium" style={{ color: "#1D1D1F" }}>
                Vous visez {mn.nom_recompense_grand as string} — encore {result.objectif - result.tampons} tampon{result.objectif - result.tampons > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        {/* Paliers progressifs */}
        {isProgressif && (result.type === "ok" || result.type === "recompense") && (
          <div className="rounded-2xl p-4 mb-5 text-left" style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#AEAEB2" }}>
              Programme progressif
            </p>
            <div className="space-y-2">
              {paliersDef.map((palier, i) => {
                const valide = !!(paliersValides[i]) && tamponsPostScan >= palier.tampons;
                const atteint = !valide && tamponsPostScan >= palier.tampons;
                const enCours = !valide && !atteint && paliersDef.findIndex((_, j) => !(paliersValides[j] && paliersDef[j].tampons <= tamponsPostScan) && paliersDef[j].tampons > tamponsPostScan) === i;
                const restants = palier.tampons - tamponsPostScan;
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: valide ? "rgba(52,199,89,0.15)" : atteint ? "rgba(255,159,10,0.15)" : enCours ? "rgba(0,122,255,0.1)" : "rgba(0,0,0,0.05)" }}>
                      {valide
                        ? <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#34C759" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <div style={{ width: 5, height: 5, borderRadius: "50%", background: atteint ? "#FF9F0A" : enCours ? "#007AFF" : "#C7C7CC" }} />
                      }
                    </div>
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold flex-shrink-0"
                          style={{ color: valide ? "#34C759" : atteint ? "#FF9F0A" : enCours ? "#007AFF" : "#C7C7CC" }}>
                          {palier.tampons}
                        </span>
                        <span className="text-[13px] font-medium"
                          style={{ color: valide || atteint || enCours ? "#1D1D1F" : "#AEAEB2" }}>
                          {palier.recompense}
                        </span>
                      </div>
                      <span className="text-[11px] ml-2 flex-shrink-0"
                        style={{ color: valide ? "#34C759" : atteint ? "#FF9F0A" : "#AEAEB2" }}>
                        {valide ? "Validé" : atteint ? "À valider" : restants > 0 ? `${restants} restant${restants > 1 ? "s" : ""}` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Anti-doublon : tampons actuels */}
        {isAntiDoublon && result.type === "anti_doublon" && (
          <div className="mb-6">
            <div className="flex justify-between text-[12px] mb-2" style={{ color: "#AEAEB2" }}>
              <span>{result.tampons} tampon{result.tampons > 1 ? "s" : ""}</span>
              <span>Objectif {result.objectif}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E5E5EA" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min((result.tampons / result.objectif) * 100, 100)}%`, background: couleur }} />
            </div>
          </div>
        )}

        {/* Anti-doublon : bouton Wallet en priorité */}
        {isAntiDoublon && (
          <div className="flex flex-col gap-3 mb-6">
            {/* Bouton Google Wallet mis en avant */}
            {isAndroid && process.env.NEXT_PUBLIC_GOOGLE_WALLET_ENABLED === "true" && (
              <div>
                <p className="text-[13px] mb-2 text-center" style={{ color: "#6E6E73" }}>
                  Ajoutez votre carte pour suivre vos tampons
                </p>
                <a href={`/api/google-wallet/generate/${walletId}`}
                  className="w-full rounded-2xl py-3.5 px-6 flex items-center justify-center gap-3 active:opacity-75 transition-opacity"
                  style={{ background: "#1a73e8" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 7H3a1 1 0 00-1 1v8a1 1 0 001 1h18a1 1 0 001-1V8a1 1 0 00-1-1z" stroke="white" strokeWidth="1.5"/>
                    <path d="M1 10h22" stroke="white" strokeWidth="1.5"/>
                  </svg>
                  <span className="text-[14px] font-semibold text-white">Ajouter à Google Wallet</span>
                </a>
              </div>
            )}
            {!isAndroid && process.env.NEXT_PUBLIC_APPLE_WALLET_ENABLED === "true" && (
              <div>
                <p className="text-[13px] mb-2 text-center" style={{ color: "#6E6E73" }}>
                  Ajoutez votre carte pour suivre vos tampons
                </p>
                <a href={`/api/apple-wallet/generate/${walletId}`}
                  className="w-full rounded-2xl py-3.5 px-6 flex items-center justify-center gap-3 active:opacity-75 transition-opacity"
                  style={{ background: "#000" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="5" width="20" height="14" rx="3" stroke="white" strokeWidth="1.5"/>
                    <path d="M2 10H22" stroke="white" strokeWidth="1.5"/>
                    <circle cx="7" cy="14.5" r="1.5" fill="white"/>
                  </svg>
                  <span className="text-[14px] font-semibold text-white">Ajouter à Apple Wallet</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* QR récompense */}
        {isRecompense && (mn.mode_recompense === "flex" ? (
          <div className="rounded-2xl px-5 py-5 mb-2" style={{ background: hexToRgba(couleur, 0.08), border: `1px solid ${hexToRgba(couleur, 0.25)}` }}>
            <p className="text-[28px] font-bold mb-1" style={{ color: couleur }}>{result.nom_recompense}</p>
            <p className="text-[14px] font-semibold mb-1" style={{ color: couleur }}>Récompense prête</p>
            <p className="text-[13px]" style={{ color: "#6E6E73" }}>Montrez cet écran au barista pour la récupérer.</p>
          </div>
        ) : (
          <RecompenseQR walletId={walletId} />
        ))}

        {/* Installer la PWA si pas encore fait */}
        <div className="mt-8"><InstallBanner /></div>
        <div className="mt-3"><PasskeyRegisterBanner telephone={telephone} /></div>

        {/* Ajouter au Wallet */}
        <div className="flex flex-col gap-2.5">
          {!isAndroid && !hasWallet && process.env.NEXT_PUBLIC_APPLE_WALLET_ENABLED === "true" && (
            <a href={`/api/apple-wallet/generate/${walletId}`}
              className="w-full rounded-2xl py-3.5 px-6 flex items-center justify-center gap-3 active:opacity-75 transition-opacity"
              style={{ background: "#000" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="3" stroke="white" strokeWidth="1.5"/>
                <path d="M2 10H22" stroke="white" strokeWidth="1.5"/>
                <circle cx="7" cy="14.5" r="1.5" fill="white"/>
              </svg>
              <span className="text-[14px] font-semibold text-white">Ajouter à Apple Wallet</span>
            </a>
          )}
          {isAndroid && !hasWallet && process.env.NEXT_PUBLIC_GOOGLE_WALLET_ENABLED === "true" && (
            <a href={`/api/google-wallet/generate/${walletId}`}
              className="w-full rounded-2xl py-3.5 px-6 flex items-center justify-center gap-3 active:opacity-75 transition-opacity"
              style={{ background: "#1a73e8" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M21 7H3a1 1 0 00-1 1v8a1 1 0 001 1h18a1 1 0 001-1V8a1 1 0 00-1-1z" stroke="white" strokeWidth="1.5"/>
                <path d="M1 10h22" stroke="white" strokeWidth="1.5"/>
              </svg>
              <span className="text-[14px] font-semibold text-white">Ajouter à Google Wallet</span>
            </a>
          )}
        </div>

        {/* Banner notif — visible si marchand notif actif + client pas encore autorisé */}
        {(isOk || isRecompense) && mn.notif_actif !== false && notifState === "idle" && !hasFcmToken && (
          <div className="mt-5 rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "rgba(0,122,255,0.08)", border: "1px solid rgba(0,122,255,0.18)" }}>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-semibold mb-0.5" style={{ color: "#1D1D1F" }}>Restez informé</p>
              <p className="text-[11px]" style={{ color: "#6E6E73" }}>Recevez vos récompenses et offres</p>
            </div>
            <button onClick={activerNotifs}
              className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white flex-shrink-0"
              style={{ background: "var(--accent)" }}>
              Activer
            </button>
          </div>
        )}
        {(isOk || isRecompense) && notifState === "granted" && (
          <div className="mt-5 rounded-2xl py-2.5 px-4 flex items-center gap-2"
            style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.18)" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 4" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[12px] font-medium" style={{ color: "#34C759" }}>Notifications activées</p>
          </div>
        )}

        {/* Prompt email — uniquement si client sans email, sur écran ok ou récompense */}
        {(isOk || isRecompense) && emailExists === false && !emailDone && (
          <div className="mt-5 rounded-2xl p-4" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.14)" }}>
            <p className="text-[13px] font-semibold mb-0.5" style={{ color: FG_MAIN }}>Recevez votre carte par email</p>
            <p className="text-[11px] mb-3" style={{ color: FG_SEC }}>Optionnel — retrouvez vos cartes depuis n'importe quel appareil</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="email" placeholder="votre@email.com" value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 13, outline: "none", color: FG_MAIN, background: BG_CARD }} />
              <button
                disabled={!emailInput.includes("@") || emailSending}
                onClick={async () => {
                  if (!emailInput.includes("@") || !telephone) return;
                  setEmailSending(true);
                  try {
                    await setClientEmail(telephone, emailInput.trim());
                    const prenom = result.type === "ok" || result.type === "recompense" ? result.prenom : "";
                    fetch("/api/send-welcome-email", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: emailInput.trim(), prenom, marchandNom: marchand.nom, walletId, mode: "inscription" }),
                    }).catch(() => {});
                    setEmailDone(true);
                  } catch { /* silent */ }
                  finally { setEmailSending(false); }
                }}
                style={{ padding: "9px 14px", borderRadius: 10, background: "linear-gradient(135deg,#007AFF,#8B5CF6)", color: "white", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !emailInput.includes("@") || emailSending ? 0.5 : 1, flexShrink: 0 }}>
                {emailSending ? "…" : "OK"}
              </button>
            </div>
          </div>
        )}
        {emailDone && (
          <div className="mt-4 rounded-2xl py-2.5 px-4 flex items-center gap-2"
            style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.18)" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 4" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[12px] font-medium" style={{ color: "#34C759" }}>Email enregistré !</p>
          </div>
        )}

        {/* Prompt PIN — uniquement si email déjà renseigné et pas de PIN */}
        {(isOk || isRecompense) && emailExists !== false && pinExists === false && !pinPromptDone && (
          <div className="mt-5 rounded-2xl p-4" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.14)" }}>
            <p className="text-[13px] font-semibold mb-0.5" style={{ color: FG_MAIN }}>Sécurisez votre compte</p>
            <p className="text-[11px] mb-3" style={{ color: FG_SEC }}>Créez un code PIN à 4 chiffres pour accéder à vos cartes depuis n&apos;importe quel appareil.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="password" inputMode="numeric" pattern="\d{4}" maxLength={4}
                placeholder="••••" value={pinPromptInput}
                onChange={e => setPinPromptInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, fontSize: 20, outline: "none", color: FG_MAIN, background: BG_CARD, textAlign: "center", letterSpacing: "0.5em", fontWeight: 700 }} />
              <button
                disabled={pinPromptInput.length !== 4 || pinPromptSending}
                onClick={async () => {
                  if (pinPromptInput.length !== 4 || !telephone) return;
                  setPinPromptSending(true);
                  try {
                    await fetch("/api/client/set-pin", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ telephone, pin: pinPromptInput }),
                    });
                    setPinPromptDone(true);
                  } catch { /* silent */ }
                  finally { setPinPromptSending(false); }
                }}
                style={{ padding: "9px 14px", borderRadius: 10, background: "linear-gradient(135deg,#007AFF,#8B5CF6)", color: "white", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: pinPromptInput.length !== 4 || pinPromptSending ? 0.5 : 1, flexShrink: 0 }}>
                {pinPromptSending ? "…" : "OK"}
              </button>
            </div>
          </div>
        )}
        {pinPromptDone && (
          <div className="mt-4 rounded-2xl py-2.5 px-4 flex items-center gap-2"
            style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.18)" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 4" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[12px] font-medium" style={{ color: "#34C759" }}>Code PIN créé !</p>
          </div>
        )}

        <a href={`/preferences/${walletId}`} className="block mt-6 text-[11px] text-center" style={{ color: "#C7C7CC" }}>
          Gérer mes notifications
        </a>
        <Link href="/mes-cartes" className="block mt-3 text-[11px] text-center" style={{ color: "#C7C7CC" }}>
          Toutes mes cartes →
        </Link>
      </div>
    </main>
  );
}

// ─── QR Récompense ────────────────────────────────────────────────────────────

function RecompenseQR({ walletId }: { walletId: string }) {
  const [qr, setQr] = useState("");

  useEffect(() => {
    import("qrcode").then(({ default: QRCode }) => QRCode.toDataURL(`https://app.walliocard.com/client/${walletId}`, {
      width: 600, margin: 1, errorCorrectionLevel: "M",
      color: { dark: "#1D1D1F", light: "#FFFFFF" },
    }).then(setQr).catch(() => {}));
  }, [walletId]);

  return (
    <div className="rounded-2xl px-5 py-5" style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.2)" }}>
      <p className="text-[15px] font-semibold mb-1" style={{ color: "#34C759" }}>Récompense à valider</p>
      <p className="text-[13px] mb-4" style={{ color: "var(--fg-secondary)" }}>
        Faites scanner ce code par le marchand.
      </p>
      {qr ? (
        <div className="flex justify-center">
          <img src={qr} alt="QR récompense" className="w-36 h-36 rounded-xl" />
        </div>
      ) : (
        <div className="w-36 h-36 mx-auto rounded-xl" style={{ background: "var(--border)" }} />
      )}
    </div>
  );
}

// ─── Passkey Prompt ───────────────────────────────────────────────────────────

function PasskeyPromptScreen({ marchand, onPasskey, onInscription, onRecuperation }: {
  marchand: Marchand;
  onPasskey: () => Promise<void>;
  onInscription: () => void;
  onRecuperation: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAndroid, setIsAndroid] = useState(false);
  useEffect(() => { setIsAndroid(/android/i.test(navigator.userAgent)); }, []);

  const label = isAndroid ? "Empreinte digitale" : "FaceID";

  async function handlePasskey() {
    setLoading(true);
    setError("");
    try {
      await onPasskey();
    } catch {
      setError("Identification annulée. Essayez de créer un compte.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col px-5 py-12" style={{ background: BG_PAGE }}>
      <div className="w-full max-w-[390px] mx-auto">
        <MarchandHeader marchand={marchand} />

        <div className="rounded-[28px] p-6 text-center" style={{ background: BG_CARD, border: `1px solid ${BORDER}`, boxShadow: "0 8px 40px rgba(0,0,0,0.05)" }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#007AFF,#8B5CF6)", boxShadow: "0 8px 24px rgba(91,124,250,0.28)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="4"/>
              <circle cx="9" cy="10" r="1.5" fill="white" stroke="none"/>
              <circle cx="15" cy="10" r="1.5" fill="white" stroke="none"/>
              <path d="M9 15c0 1.66 1.34 3 3 3s3-1.34 3-3"/>
            </svg>
          </div>

          <h2 className="text-[20px] font-semibold tracking-tight mb-2" style={{ color: FG_MAIN }}>
            Déjà inscrit ?
          </h2>
          <p className="text-[13px] leading-relaxed mb-6" style={{ color: FG_SEC }}>
            Identifiez-vous avec {label} pour retrouver vos tampons instantanément.
          </p>

          {error && <p className="text-[13px] mb-4" style={{ color: "#FF453A" }}>{error}</p>}

          <button
            onClick={handlePasskey}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white mb-3 active:opacity-80 transition-opacity"
            style={{ background: BTN_BG, boxShadow: "0 4px 24px rgba(99,102,241,0.30)", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Identification…" : `Me reconnaître avec ${label}`}
          </button>

          <button
            onClick={onInscription}
            className="w-full py-3.5 rounded-2xl text-[15px] font-medium active:opacity-80 transition-opacity"
            style={{ background: "rgba(0,0,0,0.04)", color: FG_SEC }}>
            Créer un compte
          </button>

          <button
            onClick={onRecuperation}
            className="w-full py-3 text-[13px] font-medium active:opacity-60 transition-opacity mt-1"
            style={{ background: "none", border: "none", color: FG_SEC, textDecoration: "underline", cursor: "pointer" }}>
            J&apos;ai déjà un compte → me connecter avec mon numéro
          </button>
        </div>
      </div>
    </main>
  );
}

// ─── Inscription ──────────────────────────────────────────────────────────────

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const PAYS = [
  { code: "+212", flag: "🇲🇦", label: "Maroc",        digits: 9  },
  { code: "+213", flag: "🇩🇿", label: "Algérie",      digits: 9  },
  { code: "+216", flag: "🇹🇳", label: "Tunisie",      digits: 8  },
  { code: "+33",  flag: "🇫🇷", label: "France",       digits: 9  },
  { code: "+32",  flag: "🇧🇪", label: "Belgique",     digits: 9  },
  { code: "+34",  flag: "🇪🇸", label: "Espagne",      digits: 9  },
  { code: "+39",  flag: "🇮🇹", label: "Italie",       digits: 10 },
  { code: "+40",  flag: "🇷🇴", label: "Roumanie",     digits: 9  },
  { code: "+41",  flag: "🇨🇭", label: "Suisse",       digits: 9  },
  { code: "+44",  flag: "🇬🇧", label: "Royaume-Uni",  digits: 10 },
  { code: "+49",  flag: "🇩🇪", label: "Allemagne",    digits: 10 },
  { code: "+31",  flag: "🇳🇱", label: "Pays-Bas",     digits: 9  },
  { code: "+351", flag: "🇵🇹", label: "Portugal",     digits: 9  },
  { code: "+90",  flag: "🇹🇷", label: "Turquie",      digits: 10 },
  { code: "+971", flag: "🇦🇪", label: "Émirats",      digits: 9  },
  { code: "+966", flag: "🇸🇦", label: "Arabie S.",    digits: 9  },
  { code: "+974", flag: "🇶🇦", label: "Qatar",        digits: 8  },
  { code: "+965", flag: "🇰🇼", label: "Koweït",       digits: 8  },
  { code: "+221", flag: "🇸🇳", label: "Sénégal",      digits: 9  },
  { code: "+225", flag: "🇨🇮", label: "Côte d'Ivoire",digits: 10 },
  { code: "+1",   flag: "🇺🇸", label: "USA / Canada", digits: 10 },
];

function MarchandHeader({ marchand }: { marchand: Marchand }) {
  const m = marchand as Record<string, unknown>;
  const logo = m.logo_url as string | undefined;
  const couleur = marchand.couleur_principale || "#007AFF";
  return (
    <div className="text-center mb-10">
      <div className="flex justify-center mb-4">
        {logo ? (
          <img src={logo} alt={marchand.nom}
            className="w-16 h-16 rounded-2xl object-cover"
            style={{ boxShadow: `0 8px 24px ${couleur}40` }} />
        ) : (
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[26px] font-bold text-white"
            style={{ background: couleur, boxShadow: `0 8px 24px ${couleur}40` }}>
            {marchand.nom.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <h1 className="text-[22px] font-bold tracking-tight mb-1" style={{ color: FG_MAIN }}>{marchand.nom}</h1>
      <p className="text-[14px]" style={{ color: FG_SEC }}>Programme de fidélité</p>
    </div>
  );
}

// Palette DA Wallio — light premium
const BG_PAGE   = "#F0F4FF";
const BG_CARD   = "#FFFFFF";
const BORDER    = "rgba(99,102,241,0.14)";
const FG_MAIN   = "#1D1D1F";
const FG_SEC    = "#6E6E73";
const ACCENT    = "#007AFF";
const ACCENT_FG = "#FFFFFF";
const BTN_BG    = "linear-gradient(135deg, #007AFF 0%, #8B5CF6 100%)";

const inputStyle: React.CSSProperties = {
  background: BG_CARD,
  border: `1px solid ${BORDER}`,
  color: FG_MAIN,
  WebkitAppearance: "none",
};

function InscriptionButton({ marchand, loading, consent }: { marchand: Marchand; loading: boolean; consent: boolean }) {
  const m = marchand as Record<string, unknown>;
  const couleur = (m.apple_bg_color as string) || marchand.couleur_principale || "#007AFF";
  const isLight = isLightColor(couleur);
  const textColor = isLight ? "#1D1D1F" : "#FFFFFF";
  return (
    <button type="submit" disabled={loading || !consent}
      className="w-full py-4 rounded-2xl text-[16px] font-semibold transition-opacity active:opacity-80 mt-1"
      style={{ background: couleur, color: textColor, boxShadow: consent ? `0 4px 24px ${hexToRgba(couleur, 0.35)}` : "none", opacity: consent ? 1 : 0.45 }}>
      {loading ? "Création…" : "Créer ma carte"}
    </button>
  );
}

function InscriptionForm({ marchand, parrainWalletId, onSuccess, onRecuperation }: {
  marchand: Marchand;
  parrainWalletId?: string;
  onSuccess: (client: Client, isNew: boolean) => void;
  onRecuperation: () => void;
}) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [indicatif, setIndicatif] = useState(PAYS[0]);
  const [numLocal, setNumLocal] = useState("");
  const [dateJ, setDateJ] = useState("");
  const [dateM, setDateM] = useState("");
  const [dateA, setDateA] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [consent, setConsent] = useState(false);
  const anneeMax = new Date().getFullYear() - 5;
  const annees = Array.from({ length: 90 }, (_, i) => anneeMax - i);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dateJ || !dateM || !dateA) { setError("Veuillez saisir votre date de naissance."); return; }
    const numPropre = numLocal.replace(/\D/g, "").replace(/^0/, "");
    if (numPropre.length < indicatif.digits - 1) { setError(`Numéro invalide (${indicatif.digits} chiffres attendus).`); return; }
    const telephone = `${indicatif.code}${numPropre}`;
    const date_naissance = `${dateA}-${dateM.padStart(2, "0")}-${dateJ.padStart(2, "0")}`;
    setLoading(true);
    setError("");
    try {
      const existing = await getClientByTelephone(telephone, marchand.id);
      if (existing) {
        // Même numéro de téléphone = même personne → reconnexion, pas de nouveau compte
        onSuccess(existing, false);
        return;
      }
      const { clientId, walletId } = await creerClient({
        prenom, nom, telephone, date_naissance, marchand_id: marchand.id,
        parrain_wallet_id: parrainWalletId,
        email: email.trim() || undefined,
      });
      if (email.trim()) {
        fetch("/api/send-welcome-email", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), prenom, marchandNom: marchand.nom, walletId, mode: "inscription" }),
        }).catch(() => {});
      }
      if (pin) {
        fetch("/api/client/set-pin", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telephone, pin }),
        }).catch(() => {});
      }
      onSuccess({
        id: clientId, prenom, nom, telephone: `${indicatif.code}${numPropre}`,
        date_naissance, wallet_id: walletId, marchand_id: marchand.id,
        tampons: parrainWalletId ? 1 : 0,
      }, true);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const selectStyle: React.CSSProperties = { ...inputStyle, backgroundImage: "none" };

  return (
    <main className="min-h-screen flex flex-col px-5 py-12" style={{ background: BG_PAGE }}>
      <div className="w-full max-w-[390px] mx-auto">
        <MarchandHeader marchand={marchand} />

        <div className="rounded-[28px] p-6" style={{ background: BG_CARD, border: `1px solid ${BORDER}`, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {([
              { value: prenom, set: setPrenom, placeholder: "Prénom", type: "text", autoComplete: "given-name" },
              { value: nom, set: setNom, placeholder: "Nom", type: "text", autoComplete: "family-name" },
            ] as const).map(f => (
              <input key={f.placeholder} type={f.type} required placeholder={f.placeholder}
                autoComplete={f.autoComplete} value={f.value}
                onChange={e => f.set(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-colors"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = ACCENT)}
                onBlur={e => (e.target.style.borderColor = BORDER)}
              />
            ))}

            {/* Téléphone : indicatif + numéro */}
            <div className="flex rounded-2xl overflow-hidden transition-colors"
              style={{ ...inputStyle, padding: 0, gap: 0 }}>
              <select
                value={indicatif.code}
                onChange={e => setIndicatif(PAYS.find(p => p.code === e.target.value) ?? PAYS[0])}
                className="outline-none text-[14px] font-medium shrink-0 border-r"
                style={{ background: "transparent", color: FG_MAIN, borderColor: BORDER, padding: "0 10px 0 14px", WebkitAppearance: "none" }}>
                {PAYS.map(p => (
                  <option key={p.code} value={p.code} style={{ background: BG_CARD }}>
                    {p.flag} {p.code}
                  </option>
                ))}
              </select>
              <input
                type="tel" required placeholder={`Numéro (${indicatif.digits} chiffres)`}
                autoComplete="tel-national" value={numLocal}
                onChange={e => setNumLocal(e.target.value.replace(/[^\d\s]/g, ""))}
                className="flex-1 px-4 py-3.5 text-[15px] outline-none bg-transparent"
                style={{ color: FG_MAIN }}
              />
            </div>

            {/* Date de naissance */}
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-[11px] font-medium uppercase tracking-wider px-4 pt-3 pb-1"
                style={{ color: FG_SEC }}>Date de naissance</p>
              <div className="grid grid-cols-3 divide-x" style={{ borderColor: BORDER }}>
                {[
                  { value: dateJ, set: setDateJ, placeholder: "Jour", options: Array.from({ length: 31 }, (_, i) => ({ v: String(i + 1), l: String(i + 1) })) },
                  { value: dateM, set: setDateM, placeholder: "Mois", options: MOIS.map((l, i) => ({ v: String(i + 1), l })) },
                  { value: dateA, set: setDateA, placeholder: "Année", options: annees.map(a => ({ v: String(a), l: String(a) })) },
                ].map(s => (
                  <select key={s.placeholder} required value={s.value}
                    onChange={e => s.set(e.target.value)}
                    className="w-full px-3 py-3.5 text-[14px] outline-none bg-transparent"
                    style={{ color: s.value ? FG_MAIN : FG_SEC, ...selectStyle }}>
                    <option value="" disabled>{s.placeholder}</option>
                    {s.options.map(o => <option key={o.v} value={o.v} style={{ background: BG_CARD }}>{o.l}</option>)}
                  </select>
                ))}
              </div>
            </div>

            {error && <p className="text-[13px] px-1" style={{ color: "#FF453A" }}>{error}</p>}

            <input type="email" placeholder="Email" required value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-colors"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = ACCENT)}
              onBlur={e => (e.target.style.borderColor = BORDER)} />
            <input type="password" inputMode="numeric" pattern="\d{4}" maxLength={4}
              placeholder="Code PIN à 4 chiffres" required value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none transition-colors"
              style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.5em", fontWeight: 700 }}
              onFocus={e => (e.target.style.borderColor = ACCENT)}
              onBlur={e => (e.target.style.borderColor = BORDER)} />

            <label className="flex items-center gap-3 px-1 py-1 cursor-pointer select-none">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                className="shrink-0" style={{ width: 18, height: 18, accentColor: ACCENT, cursor: "pointer" }} />
              <span className="text-[12px] leading-snug" style={{ color: FG_SEC }}>
                J&apos;accepte la{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer"
                  style={{ color: ACCENT, textDecoration: "underline", fontWeight: 600 }}>
                  politique de confidentialité
                </a>
              </span>
            </label>

            <InscriptionButton marchand={marchand} loading={loading} consent={consent} />
          </form>
        </div>

        <p className="text-center text-[13px] mt-5" style={{ color: FG_SEC }}>
          Déjà inscrit ?{" "}
          <button onClick={onRecuperation} style={{ color: ACCENT }} className="font-semibold">
            Récupérer mon compte
          </button>
        </p>
      </div>
    </main>
  );
}

// ─── Récupération ─────────────────────────────────────────────────────────────

function RecuperationForm({ marchand, onSuccess, onBack }: {
  marchand: Marchand;
  onSuccess: (client: Client) => void;
  onBack: () => void;
}) {
  const [indicatif, setIndicatif] = useState(PAYS[0]);
  const [numLocal, setNumLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const numPropre = numLocal.replace(/\D/g, "").replace(/^0/, "");
    const telephone = `${indicatif.code}${numPropre}`;
    const client = await getClientByTelephone(telephone, marchand.id);
    if (!client) {
      setError("Aucun compte trouvé avec ce numéro.");
      setLoading(false);
      return;
    }
    onSuccess(client);
  }

  return (
    <main className="min-h-screen flex flex-col px-5 py-12" style={{ background: BG_PAGE }}>
      <div className="w-full max-w-[390px] mx-auto">
        <MarchandHeader marchand={marchand} />

        <div className="rounded-[28px] p-6" style={{ background: BG_CARD, border: `1px solid ${BORDER}`, boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}>
          <p className="text-[17px] font-semibold mb-0.5" style={{ color: FG_MAIN }}>Récupérer mon compte</p>
          <p className="text-[13px] mb-5" style={{ color: FG_SEC }}>Entre le numéro utilisé lors de ton inscription</p>

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div className="flex rounded-2xl overflow-hidden transition-colors"
              style={{ ...inputStyle, padding: 0, gap: 0 }}>
              <select
                value={indicatif.code}
                onChange={e => setIndicatif(PAYS.find(p => p.code === e.target.value) ?? PAYS[0])}
                className="outline-none text-[14px] font-medium shrink-0 border-r"
                style={{ background: "transparent", color: FG_MAIN, borderColor: BORDER, padding: "0 10px 0 14px", WebkitAppearance: "none" }}>
                {PAYS.map(p => (
                  <option key={p.code} value={p.code} style={{ background: BG_CARD }}>
                    {p.flag} {p.code}
                  </option>
                ))}
              </select>
              <input
                type="tel" required placeholder={`Numéro (${indicatif.digits} chiffres)`}
                autoComplete="tel-national" value={numLocal}
                onChange={e => setNumLocal(e.target.value.replace(/[^\d\s]/g, ""))}
                className="flex-1 px-4 py-3.5 text-[15px] outline-none bg-transparent"
                style={{ color: FG_MAIN }}
              />
            </div>

            {error && <p className="text-[13px] px-1" style={{ color: "#FF453A" }}>{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl text-[16px] font-semibold transition-opacity active:opacity-80 mt-1"
              style={{ background: BTN_BG, color: ACCENT_FG, boxShadow: "0 4px 24px rgba(99,102,241,0.30)" }}>
              {loading ? "Recherche…" : "Récupérer mon compte"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] mt-5" style={{ color: FG_SEC }}>
          <button onClick={onBack} style={{ color: FG_SEC }} className="font-medium">← Retour</button>
        </p>
      </div>
    </main>
  );
}

// ─── Carte créée ──────────────────────────────────────────────────────────────

function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as Record<string, unknown>).standalone === true;
    if (standalone) return;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(ios);
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      borderRadius: 20, marginBottom: 16,
      background: "rgba(255,255,255,0.7)",
      border: "1px solid rgba(91,124,250,0.2)",
      backdropFilter: "blur(20px)",
    }}>
      <div style={{ padding: "12px 14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/wallio-instagram-profil.png" alt="Wallio" style={{ width: 32, height: 32, borderRadius: 8, display: "block" }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)", letterSpacing: -0.2 }}>Installez Wallio sur votre écran d&apos;accueil</p>
            <p style={{ fontSize: 11, color: "var(--fg-secondary)" }}>Gratuit · accès rapide à vos cartes</p>
          </div>
        </div>
        <button onClick={() => setShow(false)} style={{ background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: "var(--fg-tertiary)", fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
          Plus tard
        </button>
      </div>
      <div style={{ margin: "0 10px 10px", padding: "10px 12px", borderRadius: 12, background: "rgba(91,124,250,0.06)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {(isIos ? [
            { n: "1", t: "Appuyez sur ≡ en bas à gauche" },
            { n: "2", t: "Appuyez sur « Partager »" },
            { n: "3", t: "« Sur l\'écran d\'accueil » → Ajouter" },
          ] : [
            { n: "1", t: "Appuyez sur ⋮ (menu Chrome)" },
            { n: "2", t: "« Ajouter à l\'écran d\'accueil »" },
            { n: "3", t: "Confirmez avec « Ajouter »" },
          ]).map(s => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: "linear-gradient(135deg,#5B7CFA,#7C5BFA)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "white" }}>{s.n}</span>
              </div>
              <span style={{ fontSize: 12, color: "var(--fg-secondary)" }}>{s.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LienParrainage({ marchand }: { marchand: Marchand }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: NFC_BG }}>
      <div className="w-full max-w-[360px] text-center">
        <MarchandHeader marchand={marchand} />
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.10)", border: "1.5px solid rgba(99,102,241,0.2)" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </div>
        <h1 className="text-[24px] font-semibold tracking-tight mb-3" style={{ color: "#1D1D1F" }}>
          Vous êtes déjà membre !
        </h1>
        <p className="text-[15px] leading-relaxed mb-8" style={{ color: "#6E6E73" }}>
          Ce lien est destiné à inviter de nouveaux clients.<br />
          Pour gagner vos tampons, scannez le QR code ou approchez votre téléphone du tag NFC de l&apos;établissement.
        </p>
        <Link href="/mes-cartes"
          className="block w-full py-4 rounded-2xl text-center text-[15px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #007AFF, #8B5CF6)" }}>
          Voir mes cartes
        </Link>
      </div>
    </main>
  );
}

function CarteCreee({ client, marchand, recuperation = false, parraine = false }: { client: Client; marchand: Marchand; recuperation?: boolean; parraine?: boolean }) {
  const [isAndroid, setIsAndroid] = useState(false);
  useEffect(() => { setIsAndroid(/android/i.test(navigator.userAgent)); }, []);
  const ld = getWalletLang((marchand as unknown as Record<string, unknown>).langue as string | undefined);

  const mn = marchand as Record<string, unknown>;
  const paliersDef = (mn.paliers as { tampons: number; recompense: string }[] | undefined) || [];
  const paliersValides = (client.paliers_valides || []) as boolean[];
  const prochainPalier = mn.mode_recompense === "progressif" && paliersDef.length > 0
    ? (paliersDef.find((p, i) => !paliersValides[i]) ?? paliersDef[paliersDef.length - 1])
    : null;
  const flexObjectif = mn.mode_recompense === "flex"
    ? ((client as Record<string,unknown>).choix_fait === "grand"
      ? ((mn.objectif_tampons as number) || 10)
      : ((mn.palier_intermediaire as number) || 5))
    : null;
  const displayObjectif = prochainPalier ? prochainPalier.tampons : (flexObjectif ?? marchand.objectif_tampons);
  const displayReward = prochainPalier
    ? prochainPalier.recompense
    : mn.mode_recompense === "flex"
      ? ((client as Record<string,unknown>).choix_fait === "grand"
        ? ((mn.nom_recompense_grand as string) || ld.reward)
        : ((mn.nom_recompense_petit as string) || ld.reward))
      : ((mn.nom_recompense as string) || ld.reward);

  const [notifState, setNotifState] = useState<"idle" | "granted" | "denied">(() => {
    if (typeof window === "undefined") return "idle";
    if (!("Notification" in window)) return "denied";
    if (Notification.permission === "granted") return "granted";
    if (Notification.permission === "denied") return "denied";
    return "idle";
  });

  // Si déjà accordé, masquer après 2s pour ne pas encombrer
  useEffect(() => {
    if (notifState === "granted") {
      const t = setTimeout(() => setNotifState("denied"), 2000);
      return () => clearTimeout(t);
    }
  }, [notifState]);

  const m = marchand as Record<string, unknown>;
  const notifActif = m.notif_actif !== false;
  const notifMessage = (m.notif_message as string) ||
    `Pour ne manquer aucune de vos récompenses chez ${marchand.nom}, activez les notifications !`;
  const couleur = marchand.couleur_principale || "#007AFF";
  const logo = m.logo_url as string | undefined;

  async function activerNotifications() {
    if (!("Notification" in window)) { setNotifState("denied"); return; }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifState("granted");
      const token = await registerFcmToken();
      if (token && client.id) {
        // Sauvegarde sur le client courant
        await updateDoc(doc(db, "clients", client.id), { fcm_token: token });
        // Propage aux autres cartes du même téléphone (tous marchands)
        const cachedPhone = localStorage.getItem("wallio_client_phone");
        if (cachedPhone) {
          const { collection, query, where, getDocs } = await import("firebase/firestore");
          const snap = await getDocs(query(collection(db, "clients"), where("telephone", "==", cachedPhone)));
          await Promise.all(snap.docs.filter(d => d.id !== client.id).map(d => updateDoc(d.ref, { fcm_token: token })));
        }
      }
    } else {
      setNotifState("denied");
    }
  }

  return (
    <main className="min-h-screen flex flex-col px-5 pt-12 pb-16" style={{ background: "var(--bg)" }}>
      {/* Glow en position absolute (pas fixed) pour ne pas bloquer le scroll */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-[-10%] left-[50%] translate-x-[-50%] w-[500px] h-[400px] rounded-full"
          style={{ background: `radial-gradient(circle, ${couleur}22 0%, transparent 70%)` }} />
      </div>

      <div className="w-full max-w-[390px] mx-auto relative" style={{ zIndex: 1 }}>
        {/* Header */}
        <div className="text-center mb-7">
          <h1 className="text-[26px] font-semibold tracking-tight mb-1" style={{ color: "var(--fg)" }}>
            {recuperation ? `Bonjour, ${client.prenom} !` : `Bienvenue, ${client.prenom} !`}
          </h1>
          <p className="text-[14px]" style={{ color: "var(--fg-secondary)" }}>
            {recuperation
              ? `${client.tampons} tampon${(client.tampons ?? 0) > 1 ? "s" : ""} · Compte retrouvé`
              : "Votre carte est créée · 1er tampon ajouté"}
          </p>
          {parraine && (
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full text-[12px] font-semibold"
              style={{ background: "rgba(52,199,89,0.12)", color: "#34C759", border: "1px solid rgba(52,199,89,0.2)" }}>
              Vous avez été invité par un ami
            </div>
          )}
        </div>

        {/* Carte preview — touch-action: pan-y pour scroll Android */}
        <div className="mb-5 -mx-5 flex justify-center" style={{ touchAction: "pan-y", overflowX: "hidden" }}>
          <Suspense fallback={<div style={{ width: 340, height: 300, borderRadius: 16, background: couleur, opacity: 0.3 }} />}>
          {isAndroid ? (
            <GoogleWalletCard
              logoUrl={logo}
              logoText={marchand.nom}
              backgroundColor={(m.google_bg_color as string) || (m.apple_bg_color as string) || couleur}
              heroUrl={(m.google_hero_url as string) || (m.strip_url as string) || undefined}
              stampsCurrent={client.tampons ?? 0}
              stampsObjective={displayObjectif}
              rewardName={displayReward}
              previewUid={client.wallet_id}
              primaryLabel={(m.google_primary_label as string) || ld.stamps}
              secondaryLabel={(m.google_secondary_label as string) || "Objectif"}
              textModules={((m.google_text_modules as { header: string; body: string; id: string }[]) || [])}
              links={((m.google_links as { uri: string; description: string }[]) || [])}
            />
          ) : (
            <AppleWalletCard
              logoUrl={logo}
              logoText={marchand.nom}
              stripUrl={(m.strip_url as string) || undefined}
              backgroundColor={(m.apple_bg_color as string) || couleur}
              foregroundColor={(m.apple_fg_color as string) || undefined}
              labelColor={(m.apple_label_color as string) || undefined}
              stampsCurrent={client.tampons ?? 0}
              stampsObjective={displayObjectif}
              rewardName={displayReward}
              previewUid={client.wallet_id}
              clientPrenom={client.prenom}
              clientNom={client.nom}
              primaryLabel={(m.apple_primary_label as string) || ld.stamps}
              rewardLabel={(m.apple_reward_label as string) || ld.reward}
              memberLabel={(m.apple_member_label as string) || ld.member}
              auxiliaryFields={[
                { label: (m.apple_aux1_label as string) || "INFO", value: (m.apple_aux1_value as string) || "" },
                { label: (m.apple_aux2_label as string) || "INFO", value: (m.apple_aux2_value as string) || "" },
                { label: (m.apple_aux3_label as string) || "INFO", value: (m.apple_aux3_value as string) || "" },
              ]}
              mode="full"
              stampsOnStrip={(m.apple_stamps_on_strip as boolean) ?? false}
              stripStampStyle={(m.apple_strip_stamp_style as never) || undefined}
              stampText={(m.apple_stamp_text as string) || undefined}
              stampTextBold={(m.apple_stamp_text_bold as boolean) ?? false}
              stampTextItalic={(m.apple_stamp_text_italic as boolean) ?? false}
              stampTextSize={(m.apple_stamp_text_size as number) || undefined}
              stampColor={(m.apple_stamp_color as string) || undefined}
              stampPosition={typeof m.apple_stamp_position === "number" ? m.apple_stamp_position : m.apple_stamp_position === "top" ? 20 : m.apple_stamp_position === "bottom" ? 80 : 50}
              stampSizePreset={(m.apple_stamp_size as never) || undefined}
              stampThickness={(m.apple_stamp_thickness as number) || undefined}
              stampLogoOpacity={(m.apple_stamp_logo_opacity as number) || undefined}
            />
          )}
          </Suspense>
        </div>

        {/* Notifications */}
        {notifActif && notifState === "idle" && (
          <div className="rounded-[22px] p-5 mb-4"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", backdropFilter: "blur(40px)" }}>
            <p className="text-[15px] font-semibold mb-1" style={{ color: "var(--fg)" }}>Restez informé</p>
            <p className="text-[13px] mb-4" style={{ color: "var(--fg-secondary)", lineHeight: 1.55 }}>{notifMessage}</p>
            <div className="flex gap-2">
              <button onClick={activerNotifications}
                className="flex-1 py-3 rounded-2xl text-[14px] font-semibold text-white"
                style={{ background: "var(--accent)" }}>
                Activer
              </button>
              <button onClick={() => setNotifState("denied")}
                className="py-3 px-5 rounded-2xl text-[14px] font-medium"
                style={{ background: "rgba(255,255,255,0.08)", color: "var(--fg-secondary)" }}>
                Plus tard
              </button>
            </div>
          </div>
        )}

        {notifState === "granted" && (
          <div className="rounded-2xl py-3 px-4 mb-4 flex items-center gap-2"
            style={{ background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.2)" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 4" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-[13px] font-medium" style={{ color: "#34C759" }}>Notifications activées</p>
          </div>
        )}

        <InstallBanner />
        <PasskeyRegisterBanner telephone={client.telephone || ""} />

        {/* Boutons Wallet — Apple sur iOS, Google sur Android */}

        <div className="flex flex-col gap-2.5">
          {!isAndroid && (
            process.env.NEXT_PUBLIC_APPLE_WALLET_ENABLED === "true" ? (
              <a href={`/api/apple-wallet/generate/${client.wallet_id}`}
                className="w-full rounded-2xl py-4 px-6 flex items-center justify-center gap-3 active:opacity-75 transition-opacity"
                style={{ background: "#000", border: "1px solid rgba(255,255,255,0.15)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="3" stroke="white" strokeWidth="1.5"/>
                  <path d="M2 10H22" stroke="white" strokeWidth="1.5"/>
                  <circle cx="7" cy="14.5" r="1.5" fill="white"/>
                </svg>
                <span className="text-[15px] font-semibold text-white">Ajouter à Apple Wallet</span>
              </a>
            ) : (
              <div className="w-full rounded-2xl py-3.5 px-6 flex items-center justify-between"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
                <span className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>Apple Wallet</span>
                <span className="text-[12px]" style={{ color: "var(--fg-secondary)" }}>Bientôt disponible</span>
              </div>
            )
          )}

          {isAndroid && process.env.NEXT_PUBLIC_GOOGLE_WALLET_ENABLED === "true" && (
            <a href={`/api/google-wallet/generate/${client.wallet_id}`}
              className="w-full rounded-2xl py-4 px-6 flex items-center justify-center gap-3 active:opacity-75 transition-opacity"
              style={{ background: "#1a73e8" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M21 7H3a1 1 0 00-1 1v8a1 1 0 001 1h18a1 1 0 001-1V8a1 1 0 00-1-1z" stroke="white" strokeWidth="1.5"/>
                <path d="M1 10h22" stroke="white" strokeWidth="1.5"/>
              </svg>
              <span className="text-[15px] font-semibold text-white">Ajouter à Google Wallet</span>
            </a>
          )}
        </div>

        <Link href="/mes-cartes" className="block mt-5 mb-4 py-4 rounded-2xl text-center text-[15px] font-semibold"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--fg)" }}>
          Voir toutes mes cartes
        </Link>
      </div>
    </main>
  );
}
