// Fonctions Firestore utilisées par auth-context et la page connexion.
// Les fonctions de gestion des tampons/clients sont dans lib/loyalty.ts.
import { db } from "./firebase";
import { collection, doc, getDoc } from "firebase/firestore";

export const marchands = collection(db, "marchands");
export const clients   = collection(db, "clients");

export async function getMarchand(marchandId: string) {
  const snap = await getDoc(doc(db, "marchands", marchandId));
  return snap.exists() ? { id: snap.id, actif: false, ...snap.data() } : null;
}
