import { db } from "./firebase";
import {
  collection, doc, getDoc, getDocs, setDoc,
  updateDoc, query, where, limit, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { v4 as uuid } from "uuid";

export type Marchand = {
  id: string;
  nom: string;
  actif: boolean;
  objectif_tampons: number;
  nom_recompense: string;
  icone_tampons: string;
  couleur_principale: string;
  couleur_secondaire: string;
  anti_doublon_delai: number;
  fuseau_horaire: string;
  nfc_id?: string;
  logo_url?: string;
  slogan?: string;
  template_id?: string;
  palette_id?: string;
  parrainage_actif?: boolean;
  mode_recompense?: "cyclique" | "progressif";
  paliers?: { tampons: number; recompense: string }[];
};

export type Client = {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  date_naissance: string;
  wallet_id: string;
  marchand_id: string;
  tampons: number;
  date_inscription?: Timestamp;
  derniere_visite?: Timestamp;
  recompense_en_attente?: boolean;
  apns_push_token?: string;
  apns_device_lib_id?: string;
  wallet_type?: "apple" | "google";
  fcm_token?: string;
  parrain_id?: string;
  parrain_recompense?: boolean;
  paliers_valides?: boolean[];
};

export type TamponResult =
  | { type: "ok"; tampons: number; objectif: number; prenom: string; double?: boolean; prochainRecompense?: string }
  | { type: "recompense"; prenom: string; nom_recompense: string; tampons: number; palier_index?: number }
  | { type: "anti_doublon"; prenom: string; secondes_restantes: number }
  | { type: "not_found" };

// ─── Marchands ────────────────────────────────────────────────────────────────

export async function getMarchandByNfcId(nfcId: string): Promise<Marchand | null> {
  const q = query(collection(db, "marchands"), where("nfc_id", "==", nfcId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Marchand;
}

export async function getMarchandById(id: string): Promise<Marchand | null> {
  const snap = await getDoc(doc(db, "marchands", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Marchand;
}

export async function genererNfcId(marchandId: string): Promise<string> {
  const nfcId = uuid().replace(/-/g, "").slice(0, 12);
  await updateDoc(doc(db, "marchands", marchandId), { nfc_id: nfcId });
  return nfcId;
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function getClientByWalletId(walletId: string, marchandId: string): Promise<Client | null> {
  const q = query(
    collection(db, "clients"),
    where("wallet_id", "==", walletId),
    where("marchand_id", "==", marchandId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Client;
}

function normaliseTel(tel: string): string {
  // Normalise vers +XXXXXXXXXXX pour comparaison
  const digits = tel.replace(/\D/g, "");
  if (tel.startsWith("+")) return `+${digits}`;
  // Numéro marocain local : 0XXXXXXXXX → +212XXXXXXXXX
  if (digits.startsWith("212") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+212${digits.slice(1)}`;
  return tel.trim();
}

export async function getClientByTelephone(telephone: string, marchandId: string): Promise<Client | null> {
  const telNorm = normaliseTel(telephone);
  // Requête directe par téléphone normalisé + marchand_id (index composé Firestore)
  const snap = await getDocs(query(
    collection(db, "clients"),
    where("marchand_id", "==", marchandId),
    where("telephone", "==", telNorm),
    limit(5)
  ));
  if (snap.empty) return null;
  const best = snap.docs.find(d => d.data().apns_push_token) ?? snap.docs[0];
  return { id: best.id, ...best.data() } as Client;
}

// Trouve le client Apple/Google Wallet actif (même téléphone, même marchand)
export async function getWalletClientByTelephone(telephone: string, marchandId: string): Promise<Client | null> {
  const telNorm = normaliseTel(telephone);
  const snap = await getDocs(query(
    collection(db, "clients"),
    where("marchand_id", "==", marchandId),
    where("telephone", "==", telNorm),
    limit(5)
  ));
  const clients = snap.docs.map(d => ({ id: d.id, ...d.data() } as Client));
  return clients.find(c => c.apns_push_token || c.wallet_type) ?? null;
}

export async function creerClient(data: {
  prenom: string;
  nom: string;
  telephone: string;
  date_naissance: string;
  marchand_id: string;
  parrain_wallet_id?: string;
}): Promise<{ clientId: string; walletId: string }> {
  const { parrain_wallet_id, ...clientData } = data;
  const walletId = uuid();
  const ref = doc(collection(db, "clients"));
  const docData: Record<string, unknown> = {
    ...clientData,
    wallet_id: walletId,
    wallet_type: "apple",
    recompense_en_attente: false,
    date_inscription: serverTimestamp(),
    // derniere_visite intentionnellement absent : posé par ajouterTampon() au 1er vrai scan
  };
  if (parrain_wallet_id) {
    docData.tampons = 1;          // tampon de bienvenue pour le filleul
    docData.parrain_id = parrain_wallet_id;
    docData.parrain_recompense = false;
    // derniere_visite absent intentionnellement : 1er vrai scan pas bloqué par anti-doublon
  } else {
    docData.tampons = 0;
  }
  await setDoc(ref, docData);
  return { clientId: ref.id, walletId };
}

// ─── Tampons ──────────────────────────────────────────────────────────────────

export async function ajouterTampon(
  client: Client,
  marchand: Marchand,
  forceOverride = false
): Promise<TamponResult> {
  // Anti-doublon — ignoré si le marchand force manuellement
  if (!forceOverride && client.derniere_visite) {
    const maintenant = Date.now() / 1000;
    const ecoulee = maintenant - client.derniere_visite.seconds;
    if (ecoulee < marchand.anti_doublon_delai) {
      return {
        type: "anti_doublon",
        prenom: client.prenom,
        secondes_restantes: Math.ceil(marchand.anti_doublon_delai - ecoulee),
      };
    }
  }

  // Double tampons : actif si marchand.double_tampons_fin est dans le futur
  const m = marchand as Record<string, unknown>;
  const doubleFin = m.double_tampons_fin as string | undefined;
  const doubleActif = doubleFin ? new Date(doubleFin) > new Date() : false;
  const increment = doubleActif ? 2 : 1;
  const nouveauxTampons = client.tampons + increment;

  // ── Mode progressif ────────────────────────────────────────────────────────
  if (marchand.mode_recompense === "progressif" && marchand.paliers?.length) {
    const paliers = marchand.paliers;
    const paliersValides = client.paliers_valides; // undefined = pas encore inscrit

    // Mid-cycle : client avait des tampons en cours en mode cyclique au moment du switch
    // → il finit son tour cyclique, puis basculera automatiquement au prochain scan à 0
    if (paliersValides === undefined && client.tampons > 0) {
      const objectif = marchand.objectif_tampons;
      if (nouveauxTampons >= objectif) {
        await updateDoc(doc(db, "clients", client.id), {
          tampons: 0,
          recompense_en_attente: true,
          derniere_visite: serverTimestamp(),
        });
        return { type: "recompense", prenom: client.prenom, nom_recompense: marchand.nom_recompense, tampons: nouveauxTampons };
      }
      await updateDoc(doc(db, "clients", client.id), { tampons: nouveauxTampons, derniere_visite: serverTimestamp() });
      return { type: "ok", tampons: nouveauxTampons, objectif, prenom: client.prenom, double: doubleActif };
    }

    // Progressif : client inscrit (paliers_valides défini) ou nouveau client (tampons = 0)
    const pv = paliersValides ?? [];
    const enrolling = paliersValides === undefined; // premier scan progressif → inscrire

    const palierIndex = paliers.findIndex((p, i) => !pv[i] && nouveauxTampons >= p.tampons);

    if (palierIndex !== -1) {
      await updateDoc(doc(db, "clients", client.id), {
        tampons: nouveauxTampons,
        recompense_en_attente: true,
        derniere_visite: serverTimestamp(),
        ...(enrolling ? { paliers_valides: pv } : {}),
      });
      return {
        type: "recompense",
        prenom: client.prenom,
        nom_recompense: paliers[palierIndex].recompense,
        tampons: nouveauxTampons,
        palier_index: palierIndex,
      };
    }

    const prochainPalier = paliers.find((p, i) => !pv[i] && p.tampons > nouveauxTampons)
      ?? paliers[paliers.length - 1];

    await updateDoc(doc(db, "clients", client.id), {
      tampons: nouveauxTampons,
      derniere_visite: serverTimestamp(),
      ...(enrolling ? { paliers_valides: pv } : {}),
    });
    return {
      type: "ok",
      tampons: nouveauxTampons,
      objectif: prochainPalier.tampons,
      prenom: client.prenom,
      double: doubleActif,
      prochainRecompense: prochainPalier.recompense,
    };
  }

  // ── Mode cyclique (défaut) ─────────────────────────────────────────────────
  const objectif = marchand.objectif_tampons;
  if (nouveauxTampons >= objectif) {
    await updateDoc(doc(db, "clients", client.id), {
      tampons: 0,
      recompense_en_attente: true,
      derniere_visite: serverTimestamp(),
    });
    return { type: "recompense", prenom: client.prenom, nom_recompense: marchand.nom_recompense, tampons: nouveauxTampons };
  }

  await updateDoc(doc(db, "clients", client.id), { tampons: nouveauxTampons, derniere_visite: serverTimestamp() });
  return { type: "ok", tampons: nouveauxTampons, objectif, prenom: client.prenom, double: doubleActif };
}

export async function validerRecompense(
  clientId: string,
  mode?: "cyclique" | "progressif",
  palierIndex?: number,
  paliersValides?: boolean[],
  totalPaliers?: number,
) {
  if (mode === "progressif" && palierIndex !== undefined) {
    const nouveauxPV = [...(paliersValides || [])];
    nouveauxPV[palierIndex] = true;
    // Dernier palier validé → repart à zéro (nouveau cycle)
    const cycleTermine = totalPaliers !== undefined && nouveauxPV.filter(Boolean).length >= totalPaliers;
    await updateDoc(doc(db, "clients", clientId), {
      recompense_en_attente: false,
      paliers_valides: cycleTermine ? [] : nouveauxPV,
      ...(cycleTermine ? { tampons: 0 } : {}),
    });
  } else {
    await updateDoc(doc(db, "clients", clientId), { recompense_en_attente: false, tampons: 0 });
  }
}

// ─── Utils ────────────────────────────────────────────────────────────────────

export function formatTemps(secondes: number): string {
  if (secondes < 3600) return `${Math.ceil(secondes / 60)} min`;
  if (secondes < 86400) return `${Math.ceil(secondes / 3600)} h`;
  return `${Math.ceil(secondes / 86400)} jour${Math.ceil(secondes / 86400) > 1 ? "s" : ""}`;
}

export function formatTempsDepuis(ts?: { seconds: number } | null): string {
  if (!ts) return "jamais";
  const sec = Date.now() / 1000 - ts.seconds;
  if (sec < 60) return "à l'instant";
  if (sec < 3600) return `il y a ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `il y a ${Math.floor(sec / 3600)} h`;
  const j = Math.floor(sec / 86400);
  if (j === 1) return "hier";
  if (j < 30) return `il y a ${j} jours`;
  if (j < 365) return `il y a ${Math.floor(j / 30)} mois`;
  return `il y a ${Math.floor(j / 365)} an(s)`;
}

export async function setTampons(clientId: string, tampons: number): Promise<void> {
  await updateDoc(doc(db, "clients", clientId), { tampons: Math.max(0, tampons) });
}

export const WALLET_KEY = (marchandId: string) => `wallio_${marchandId}`;

// ─── Parrainage ───────────────────────────────────────────────────────────────

// Crédite 1 tampon fixe au parrain (bypass anti-doublon, jamais doublé).
// Retourne le wallet_id du parrain pour déclencher le push Wallet côté appelant.
export async function traiterParrainage(
  parrainWalletId: string,
  marchandId: string,
): Promise<{ walletId: string; recompense: boolean } | null> {
  const q = query(
    collection(db, "clients"),
    where("wallet_id", "==", parrainWalletId),
    where("marchand_id", "==", marchandId),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const parrainDoc = snap.docs[0];
  const parrain = { id: parrainDoc.id, ...parrainDoc.data() } as Client;

  const marchandSnap = await getDoc(doc(db, "marchands", marchandId));
  if (!marchandSnap.exists()) return null;
  const marchand = { id: marchandSnap.id, ...marchandSnap.data() } as Marchand;

  // +1 fixe : jamais doublé par promo double_tampons, bypass anti-doublon
  // Ne met PAS à jour derniere_visite — c'est un bonus, pas une vraie visite
  const nouveaux = parrain.tampons + 1;

  // ── Mode progressif ──────────────────────────────────────────────────────────
  if (marchand.mode_recompense === "progressif" && marchand.paliers?.length) {
    const paliers = marchand.paliers;
    const paliersValides = parrain.paliers_valides;

    // Mid-cycle : finit le tour cyclique d'abord
    if (paliersValides === undefined && parrain.tampons > 0) {
      const recompense = nouveaux >= marchand.objectif_tampons;
      await updateDoc(doc(db, "clients", parrain.id), recompense
        ? { tampons: 0, recompense_en_attente: true }
        : { tampons: nouveaux });
      return { walletId: parrainWalletId, recompense };
    }

    const pv = paliersValides ?? [];
    const enrolling = paliersValides === undefined;
    const palierIndex = paliers.findIndex((p, i) => !pv[i] && nouveaux >= p.tampons);

    if (palierIndex !== -1) {
      await updateDoc(doc(db, "clients", parrain.id), {
        tampons: nouveaux,
        recompense_en_attente: true,
        ...(enrolling ? { paliers_valides: pv } : {}),
      });
      return { walletId: parrainWalletId, recompense: true };
    }

    await updateDoc(doc(db, "clients", parrain.id), {
      tampons: nouveaux,
      ...(enrolling ? { paliers_valides: pv } : {}),
    });
    return { walletId: parrainWalletId, recompense: false };
  }

  // ── Mode cyclique (défaut) ───────────────────────────────────────────────────
  const recompense = nouveaux >= marchand.objectif_tampons;
  await updateDoc(doc(db, "clients", parrain.id), recompense
    ? { tampons: 0, recompense_en_attente: true }
    : { tampons: nouveaux });
  return { walletId: parrainWalletId, recompense };
}

// Vérifie si le filleul a un parrain non encore récompensé et le récompense.
// Appelé après chaque tampon ajouté (NFC + QR). Bypass anti-doublon par design.
export async function checkEtRecompenseParrain(
  client: Client,
  marchandId: string,
): Promise<{ walletId: string; recompense: boolean } | null> {
  if (!client.parrain_id || client.parrain_recompense) return null;
  // Marquer immédiatement pour éviter un double-reward en cas de race condition
  await updateDoc(doc(db, "clients", client.id), { parrain_recompense: true });
  return traiterParrainage(client.parrain_id, marchandId);
}
