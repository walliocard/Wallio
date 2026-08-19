import { db } from "./firebase";
import {
  collection, doc, getDoc, getDocs, setDoc,
  updateDoc, query, where, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { v4 as uuid } from "uuid";

export type PalierConfig = {
  tampons: number;    // tampons nécessaires depuis le palier précédent
  recompense: string;
};

export type Marchand = {
  id: string;
  nom: string;
  actif: boolean;
  objectif_tampons: number;
  nom_recompense: string;
  mode_recompense: "cyclique" | "progressif";
  paliers?: PalierConfig[];
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
  niveau?: number;
  paliers_valides?: boolean[];
  date_inscription?: Timestamp;
  derniere_visite?: Timestamp;
  recompense_en_attente?: boolean;
};

export type TamponResult =
  | { type: "ok"; tampons: number; objectif: number; prenom: string }
  | { type: "recompense"; prenom: string; nom_recompense: string; tampons: number }
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

export async function getClientByTelephone(telephone: string, marchandId: string): Promise<Client | null> {
  const q = query(
    collection(db, "clients"),
    where("telephone", "==", telephone),
    where("marchand_id", "==", marchandId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Client;
}

export async function creerClient(data: {
  prenom: string;
  nom: string;
  telephone: string;
  date_naissance: string;
  marchand_id: string;
}): Promise<{ clientId: string; walletId: string }> {
  const walletId = uuid();
  const ref = doc(collection(db, "clients"));
  await setDoc(ref, {
    ...data,
    wallet_id: walletId,
    wallet_type: "apple",
    tampons: 0,
    niveau: 0,
    recompense_en_attente: false,
    date_inscription: serverTimestamp(),
    derniere_visite: null,
  });
  return { clientId: ref.id, walletId };
}

// ─── Tampons ──────────────────────────────────────────────────────────────────

export async function ajouterTampon(
  client: Client,
  marchand: Marchand
): Promise<TamponResult> {
  // Anti-doublon
  if (client.derniere_visite) {
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

  const nouveauxTampons = client.tampons + 1;

  // ── Mode progressif ──────────────────────────────────────────────────────────
  if (marchand.mode_recompense === "progressif" && marchand.paliers?.length) {
    const niveau = client.niveau ?? 0;
    const palier = marchand.paliers[niveau];

    if (!palier) {
      // Tous les paliers déjà complétés — tampon bonus
      await updateDoc(doc(db, "clients", client.id), { tampons: nouveauxTampons, derniere_visite: serverTimestamp() });
      return { type: "ok", tampons: nouveauxTampons, objectif: nouveauxTampons, prenom: client.prenom };
    }

    if (nouveauxTampons >= palier.tampons) {
      await updateDoc(doc(db, "clients", client.id), {
        tampons: nouveauxTampons,
        recompense_en_attente: true,
        derniere_visite: serverTimestamp(),
      });
      return { type: "recompense", prenom: client.prenom, nom_recompense: palier.recompense, tampons: nouveauxTampons };
    }

    await updateDoc(doc(db, "clients", client.id), { tampons: nouveauxTampons, derniere_visite: serverTimestamp() });
    return { type: "ok", tampons: nouveauxTampons, objectif: palier.tampons, prenom: client.prenom };
  }

  // ── Mode cyclique ────────────────────────────────────────────────────────────
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
  return { type: "ok", tampons: nouveauxTampons, objectif, prenom: client.prenom };
}

export async function validerRecompense(
  clientId: string,
  marchand: Marchand,
  niveau = 0,
  paliers_valides: boolean[] = []
) {
  const updates: Record<string, unknown> = { recompense_en_attente: false, tampons: 0 };
  if (marchand.mode_recompense === "progressif") {
    const newPaliersValides = [...paliers_valides];
    newPaliersValides[niveau] = true;
    updates.niveau = niveau + 1;
    updates.paliers_valides = newPaliersValides;
  }
  await updateDoc(doc(db, "clients", clientId), updates);
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
