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
import { doc, updateDoc, getDocs, getDocsFromServer, collection, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { registerFcmToken } from "@/lib/fcm";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { useTimeTheme } from "@/hooks/useTimeTheme";
import { getWalletLang } from "@/lib/wallet-lang";
import StampPage, { type StampMerchant } from "@/components/StampPage";

// Lazy-load composants lourds — pas besoin au premier rendu
const AppleWalletCard = lazy(() => import("@/components/AppleWalletCard"));
const GoogleWalletCard = lazy(() => import("@/components/GoogleWalletCard"));
const PasskeyRegisterBanner = lazy(() => import("@/components/PasskeyRegisterBanner"));
const InstallBanner = lazy(() => import("@/components/InstallBanner"));

type Screen =
  | { type: "loading" }
  | { type: "result"; result: TamponResult; client: Client; marchand: Marchand; fresh?: boolean }
  | { type: "inscription"; marchand: Marchand; refParam: string | null }
  | { type: "passkey_prompt"; marchand: Marchand; refParam: string | null }
  | { type: "recuperation"; marchand: Marchand }
  | { type: "carte"; client: Client; marchand: Marchand; recuperation?: boolean; parraine?: boolean }
  | { type: "lien_parrainage"; marchand: Marchand }
  | { type: "erreur"; message: string; retryable?: boolean };

function setCookiePhone(phone: string) {
  const exp = new Date();
  exp.setFullYear(exp.getFullYear() + 1);
  document.cookie = `wallio_p=${encodeURIComponent(phone)}; expires=${exp.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookiePhone(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)wallio_p=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function getMerchantDisplay(marchand: Marchand): StampMerchant {
  const mn = marchand as Record<string, unknown>;
  const isRound = mn.logo_shape === "round";
  return {
    name: marchand.nom,
    logo: (isRound && mn.logo_circle_url) ? mn.logo_circle_url as string : (mn.logo_url as string | undefined),
    color: (mn.apple_bg_color as string) || marchand.couleur_principale || "#007AFF",
    round: isRound,
  };
}

const IS_PREVIEW_ENV =
  typeof process !== "undefined" &&
  (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_VERCEL_ENV === "preview");

export default function NfcPage({ params }: { params: Promise<{ marchandId: string }> }) {
  const { marchandId } = use(params);
  const [screen, setScreen] = useState<Screen>({ type: "loading" });
  // Lecture synchrone du cache localStorage → logo + couleur du marchand dès le 1er render
  const [stampMerchant, setStampMerchant] = useState<StampMerchant | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(`wm_${marchandId}`);
      if (raw) {
        const { d, ts } = JSON.parse(raw);
        if (d && Date.now() - ts < 4 * 60 * 60 * 1000) return getMerchantDisplay(d as Marchand);
      }
    } catch {}
    return null;
  });
  useTimeTheme("light"); // page NFC toujours en mode clair
  useAutoRefresh(screen.type === "loading");

  // Polling quand le client attend un choix — se met à jour si le barista choisit pour lui
  const choixRequisKey = screen.type === "result" && screen.result.type === "choix_requis"
    ? screen.client.wallet_id : null;
  // Page de scan transitoire : après un tampon CRÉDITÉ, neutralise l'URL (barre d'adresse
  // + bouton retour) via un replaceState natif — SANS naviguer, la page résultat reste affichée.
  // Ne touche ni au tampon, ni au dead flag, ni à l'anti-doublon. Scopé au seul cas "crédité".
  useEffect(() => {
    if (screen.type === "result" && (screen.result.type === "ok" || screen.result.type === "recompense")) {
      try { window.history.replaceState(null, "", "/mes-cartes"); } catch { /* */ }
    }
  }, [screen]);

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

  function logNfcClient(client: Client, marchand: Marchand, result: TamponResult) {
    if (result.type !== "ok" && result.type !== "recompense" && result.type !== "anti_doublon") return;
    addDoc(collection(db, "marchands", marchand.id, "historique"), {
      client_id: client.id,
      client_prenom: client.prenom,
      client_nom: client.nom || "",
      tampons_apres: result.type === "anti_doublon" ? client.tampons : ((result as Record<string, unknown>).tampons ?? client.tampons),
      recompense: result.type === "recompense",
      type: result.type === "anti_doublon" ? "anti_doublon" : "nfc_client",
      added_by: "Client",
      created_at: serverTimestamp(),
    }).catch(() => {});
  }

  const traiterTampon = useCallback(async (client: Client, marchand: Marchand) => {
    const result = await ajouterTampon(client, marchand);
    setScreen({ type: "result", result, client, marchand, fresh: true });
    try { sessionStorage.setItem(`nfc_result_${marchand.id}`, JSON.stringify({ result, client })); } catch {}
    try { localStorage.setItem(`nfc_dead_${marchand.id}`, JSON.stringify({ ts: Date.now(), type: "result", result, client })); } catch {}
    logNfcClient(client, marchand, result);
    if (result.type === "ok" || result.type === "recompense" || result.type === "choix_requis") {
      try { navigator.vibrate(result.type === "recompense" ? [80, 60, 120] : result.type === "choix_requis" ? [60, 40, 60] : 40); } catch {}
      // Push Wallet uniquement sur ok/recompense — pour choix_requis, on attend que le
      // client fasse son choix via enregistrer-choix (qui pushera avec choix_fait déjà positionné)
      if (result.type !== "choix_requis") {
        const body = JSON.stringify({ walletId: client.wallet_id });
        const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
        fetch("/api/apple-wallet/push-update", opts).catch(() => {});
        fetch("/api/google-wallet/push-update", opts).catch(() => {});
      }
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
      // ── Mode preview (dev / preview Vercel uniquement) ───────────────────────
      if (IS_PREVIEW_ENV) {
        const previewParam = new URLSearchParams(window.location.search).get("preview");
        if (previewParam) {
          const baseMarchand = {
            id: "preview", nom: "Aperçu Wallio", actif: true, couleur_principale: "#2F7BFF",
            couleur_secondaire: "#8B5CF6", objectif_tampons: 10, nom_recompense: "votre matcha",
            anti_doublon_delai: 86400, icone_tampons: "☕", fuseau_horaire: "Africa/Casablanca",
          } as Record<string, unknown>;
          // Variantes de mode selon le paramètre
          const progMarchand = { ...baseMarchand, mode_recompense: "progressif",
            paliers: [{ tampons: 3, recompense: "un café" }, { tampons: 6, recompense: "un dessert" }, { tampons: 10, recompense: "un plat" }] };
          const flexMarchand = { ...baseMarchand, mode_recompense: "flex",
            palier_intermediaire: 5, nom_recompense_petit: "un café", nom_recompense_grand: "un plat" };
          const mockMarchand = (
            previewParam === "progressive" ? progMarchand
            : previewParam === "flex" ? flexMarchand
            : baseMarchand
          ) as unknown as Marchand;
          const mockClient = { id: "preview", prenom: "Karim", nom: "M.", telephone: "+212600000000", date_naissance: "", wallet_id: "preview-wallet", marchand_id: "preview", tampons: 6 } as Client;
          setStampMerchant(getMerchantDisplay(mockMarchand));
          if (previewParam === "stamp")
            setScreen({ type: "result", result: { type: "ok", tampons: 7, objectif: 10, prenom: "Karim" }, client: mockClient, marchand: mockMarchand, fresh: true });
          else if (previewParam === "progressive")
            setScreen({ type: "result", result: { type: "ok", tampons: 4, objectif: 10, prenom: "Karim", prochainRecompense: "un dessert" }, client: { ...mockClient, tampons: 3 }, marchand: mockMarchand, fresh: true });
          else if (previewParam === "flex")
            setScreen({ type: "result", result: { type: "choix_requis", prenom: "Karim", tampons: 5, palier_intermediaire: 5, nom_recompense_petit: "un café", nom_recompense_grand: "un plat" }, client: { ...mockClient, tampons: 5, choix_en_attente: true } as Client, marchand: mockMarchand, fresh: true });
          else if (previewParam === "reward")
            setScreen({ type: "result", result: { type: "recompense", prenom: "Karim", nom_recompense: "votre matcha", tampons: 10 }, client: { ...mockClient, tampons: 9 }, marchand: mockMarchand, fresh: true });
          else if (previewParam === "duplicate")
            setScreen({ type: "result", result: { type: "anti_doublon", prenom: "Karim", secondes_restantes: 72000, tampons: 7, objectif: 10 }, client: mockClient, marchand: mockMarchand, fresh: true });
          else if (previewParam === "error")
            setScreen({ type: "erreur", message: "Problème de connexion. Réessayez.", retryable: true });
          return;
        }
      }

      try {
        const CACHE_KEY = `wm_${marchandId}`;
        const CACHE_TTL = 4 * 60 * 60 * 1000; // 4h
        let marchand: Marchand | null = null;
        try {
          const raw = localStorage.getItem(CACHE_KEY);
          if (raw) {
            const { d, ts } = JSON.parse(raw);
            if (Date.now() - ts < CACHE_TTL) {
              marchand = d;
              // Affiche immédiatement les données du marchand pour le chargement animé
              setStampMerchant(getMerchantDisplay(d as Marchand));
            }
          }
        } catch {}
        if (!marchand) {
          marchand = await getMarchandByNfcId(marchandId);
          if (marchand) try { localStorage.setItem(CACHE_KEY, JSON.stringify({ d: marchand, ts: Date.now() })); } catch {}
        }
        if (!marchand || !marchand.actif) {
          setScreen({ type: "erreur", message: "Ce service est temporairement indisponible.", retryable: false });
          return;
        }
        // Mettre à jour les données marchand avec les données fraîches
        setStampMerchant(getMerchantDisplay(marchand));

        // Dead flag — back_forward/reload → afficher résultat en cache, jamais de re-tampon
        // Protection étendue : navType "navigate" récent (< 60s) = retry depuis erreur, même protection
        const navType = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type;
        const isRecentDeadFlag = (() => {
          try {
            const r = localStorage.getItem(`nfc_dead_${marchand.id}`);
            if (!r) return false;
            return Date.now() - (JSON.parse(r) as { ts: number }).ts < 60_000;
          } catch { return false; }
        })();
        if (navType !== "navigate" || isRecentDeadFlag) {
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
        const cachedEmail  = localStorage.getItem("wallio_client_email");
        const cachedPin    = localStorage.getItem("wallio_client_pin");
        if (cachedPhone && cachedPrenom && cachedNom) {
          // Peut-être déjà inscrit ici (localStorage perdu / nouvel appareil)
          // Note : si compteSupprimeIci, getClientByTelephone retournera null → creerClient() comme nouveau
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
            email: cachedEmail || undefined,
          });
          // Sync PIN + email depuis wallio_users vers le nouveau doc client
          fetch("/api/client/sync-user-pin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telephone: cachedPhone }) }).catch(() => {});
          fetch("/api/admin/notify-new-client", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prenom: cachedPrenom, nom: cachedNom, marchandNom: marchand.nom }) }).catch(() => {});
          if (cachedEmail) {
            fetch("/api/send-welcome-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: cachedEmail, prenom: cachedPrenom, marchandNom: marchand.nom, walletId: newWalletId, mode: "inscription" }) }).catch(() => {});
          }
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
            logNfcClient(newClient, marchand, result);
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
        setScreen({ type: "erreur", message: "Problème de connexion. Vérifiez votre réseau et réessayez." });
      }
    }
    init();
  }, [marchandId, traiterTampon]);

  // ── Rendu : loading + result → StampPage (module conservé entre les deux états) ──
  if (screen.type === "loading" || screen.type === "result") {
    const merchant = screen.type === "result"
      ? getMerchantDisplay(screen.marchand)
      : (stampMerchant ?? { name: "", color: "#007AFF" });
    return (
      <StampPage
        merchant={merchant}
        result={screen.type === "result" ? { result: screen.result, client: screen.client, marchand: screen.marchand } : null}
        fresh={screen.type === "result" ? screen.fresh : undefined}
        onRetry={() => window.location.reload()}
      />
    );
  }
  if (screen.type === "erreur") return (
    <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", background: "#F0F4FF", fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <div style={{ width: 56, height: 56, margin: "0 auto 20px", borderRadius: 16, background: "rgba(255,59,48,0.10)", border: "1.5px solid rgba(255,59,48,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#FF3B30" }}>!</span>
        </div>
        <p style={{ fontSize: 17, fontWeight: 600, color: "#1C1C1E", marginBottom: 8 }}>{screen.message}</p>
        {screen.retryable !== false && (
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: "12px 24px", borderRadius: 14, background: "linear-gradient(135deg,#007AFF,#8B5CF6)", color: "white", fontSize: 15, fontWeight: 600, border: "none", cursor: "pointer" }}>
            Réessayer
          </button>
        )}
      </div>
    </main>
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
      onBack={() => setScreen({ type: "passkey_prompt", marchand: screen.marchand, refParam: screen.refParam })}
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
          logNfcClient(client, screen.marchand, result);
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
      onPasskey={async () => {
        setScreen({ type: "loading" });
        const { authenticateWithPasskey } = await import("@/lib/passkey-client");
        const telephone = await authenticateWithPasskey();
        if (!telephone) { setScreen({ type: "recuperation", marchand: screen.marchand }); return; }
        const client = await getClientByTelephone(telephone, screen.marchand.id);
        if (!client) { setScreen({ type: "recuperation", marchand: screen.marchand }); return; }
        localStorage.setItem(WALLET_KEY(marchandId), client.wallet_id);
        localStorage.setItem("wallio_client_phone", telephone);
        setCookiePhone(telephone);
        await traiterTampon(client, screen.marchand);
      }}
      onSuccess={(client) => {
        localStorage.setItem(WALLET_KEY(marchandId), client.wallet_id);
        if (client.telephone)      { localStorage.setItem("wallio_client_phone", client.telephone); setCookiePhone(client.telephone); }
        if (client.prenom)         localStorage.setItem("wallio_client_prenom", client.prenom);
        if (client.nom)            localStorage.setItem("wallio_client_nom", client.nom);
        if (client.date_naissance) localStorage.setItem("wallio_client_dob", client.date_naissance);
        setScreen({ type: "carte", client, marchand: screen.marchand, recuperation: true });
        try { localStorage.setItem(`nfc_dead_${screen.marchand.id}`, JSON.stringify({ ts: Date.now(), type: "carte", client, recuperation: true })); } catch {}
      }}
      onBack={() => setScreen({ type: "passkey_prompt", marchand: screen.marchand, refParam: null })}
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
          <h2 className="text-[22px] font-bold tracking-tight mb-2" style={{ color: FG_MAIN }}>
            Créer ma carte
          </h2>
          <p className="text-[13px] leading-relaxed mb-6" style={{ color: FG_SEC }}>
            Rejoignez le programme de fidélité et cumulez vos tampons à chaque visite.
          </p>

          {error && <p className="text-[13px] mb-4" style={{ color: "#FF453A" }}>{error}</p>}

          <button
            onClick={onInscription}
            className="w-full py-4 rounded-2xl text-[16px] font-semibold text-white mb-3 active:opacity-80 transition-opacity"
            style={{ background: BTN_BG, boxShadow: "0 4px 24px rgba(99,102,241,0.30)" }}>
            Créer mon compte
          </button>

          <button
            onClick={onRecuperation}
            className="w-full py-3 text-[13px] font-medium active:opacity-60 transition-opacity"
            style={{ background: "none", border: "none", color: FG_SEC, cursor: "pointer" }}>
            Déjà inscrit ? Me connecter avec mon numéro
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
  const isRound = m.logo_shape === "round";
  const logo = (isRound && m.logo_circle_url) ? m.logo_circle_url as string : (m.logo_url as string | undefined);
  const couleur = marchand.couleur_principale || "#007AFF";
  return (
    <div className="text-center mb-10">
      <div className="flex justify-center mb-4">
        {logo ? (
          <img src={logo} alt={marchand.nom}
            className={`w-16 h-16 object-contain ${isRound ? "rounded-full" : "rounded-2xl"}`}
            style={{ boxShadow: `0 8px 24px ${couleur}40` }} />
        ) : (
          <div className={`w-16 h-16 flex items-center justify-center text-[26px] font-bold text-white ${isRound ? "rounded-full" : "rounded-2xl"}`}
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

function InscriptionForm({ marchand, parrainWalletId, onSuccess, onRecuperation, onBack }: {
  marchand: Marchand;
  parrainWalletId?: string;
  onSuccess: (client: Client, isNew: boolean) => void;
  onRecuperation: () => void;
  onBack?: () => void;
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
      fetch("/api/admin/notify-new-client", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prenom, nom, marchandNom: marchand.nom }) }).catch(() => {});
      if (email.trim()) {
        fetch("/api/send-welcome-email", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), prenom, marchandNom: marchand.nom, walletId, mode: "inscription" }),
        }).catch(() => {});
      }
      if (pin) {
        await fetch("/api/client/set-pin", {
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
        {onBack && (
          <p className="text-center text-[13px] mt-2">
            <button onClick={onBack} style={{ color: FG_SEC }} className="font-medium">← Retour</button>
          </p>
        )}
      </div>
    </main>
  );
}

// ─── Récupération ─────────────────────────────────────────────────────────────

function RecuperationForm({ marchand, onSuccess, onBack, onPasskey }: {
  marchand: Marchand;
  onSuccess: (client: Client) => void;
  onBack: () => void;
  onPasskey?: () => Promise<void>;
}) {
  const [indicatif, setIndicatif] = useState(PAYS[0]);
  const [numLocal, setNumLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAndroid, setIsAndroid] = useState(false);
  useEffect(() => { setIsAndroid(/android/i.test(navigator.userAgent)); }, []);

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
          <p className="text-[17px] font-semibold mb-0.5" style={{ color: FG_MAIN }}>Déjà inscrit ?</p>
          <p className="text-[13px] mb-5" style={{ color: FG_SEC }}>Entre le numéro utilisé lors de ton inscription</p>

          {onPasskey && (
            <button
              type="button"
              onClick={async () => { setPasskeyLoading(true); try { await onPasskey(); } catch { setError("Identification annulée."); } finally { setPasskeyLoading(false); } }}
              disabled={passkeyLoading || loading}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold mb-4 active:opacity-80 transition-opacity"
              style={{ background: BTN_BG, color: ACCENT_FG, boxShadow: "0 4px 24px rgba(99,102,241,0.25)", opacity: passkeyLoading ? 0.7 : 1 }}>
              {passkeyLoading ? "Identification…" : `Me reconnaître avec ${isAndroid ? "Empreinte digitale" : "Face ID"}`}
            </button>
          )}

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
              logoShape={(marchand as Record<string, unknown>).logo_shape as "square" | "round" || "square"}
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
