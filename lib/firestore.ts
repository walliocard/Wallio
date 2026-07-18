import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export const marchands = collection(db, "marchands");
export const clients = collection(db, "clients");

export async function getMarchand(marchandId: string) {
  const snap = await getDoc(doc(db, "marchands", marchandId));
  return snap.exists() ? { id: snap.id, actif: false, ...snap.data() } : null;
}

export async function getClientByWalletId(walletId: string, marchandId: string) {
  const q = query(clients, where("wallet_id", "==", walletId), where("marchand_id", "==", marchandId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function getClientByTelephone(telephone: string, marchandId: string) {
  const q = query(clients, where("telephone", "==", telephone), where("marchand_id", "==", marchandId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function creerClient(data: {
  prenom: string;
  nom: string;
  telephone: string;
  date_naissance: string;
  marchand_id: string;
  wallet_id: string;
  wallet_type: "apple" | "google";
}) {
  const ref = doc(clients);
  await setDoc(ref, {
    ...data,
    tampons: 0,
    niveau: 0,
    date_inscription: serverTimestamp(),
    derniere_visite: serverTimestamp(),
  });
  return ref.id;
}

export async function ajouterTampon(clientId: string) {
  const ref = doc(db, "clients", clientId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const tampons = (snap.data().tampons || 0) + 1;
  await updateDoc(ref, { tampons, derniere_visite: serverTimestamp() });
  return tampons;
}

export async function updateWalletId(clientId: string, walletId: string) {
  await updateDoc(doc(db, "clients", clientId), { wallet_id: walletId });
}
