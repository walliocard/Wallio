"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { onSnapshot, getDoc, doc } from "firebase/firestore";
import { auth, db } from "./firebase";

type MarchandData = {
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
  photo_url?: string;
  [key: string]: unknown;
};

type AuthContextType = {
  user: User | null;
  marchand: MarchandData | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  marchand: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [marchand, setMarchand] = useState<MarchandData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubSnap: (() => void) | null = null;

    const fallback = setTimeout(() => setLoading(false), 5000);

    const unsubAuth = onAuthStateChanged(
      auth,
      (u) => {
        clearTimeout(fallback);
        setUser(u);

        // Annuler l'éventuel snapshot précédent
        unsubSnap?.();
        unsubSnap = null;

        if (u) {
          const marchandRef = doc(db, "marchands", u.uid);

          // Filet de sécurité : si getDoc et onSnapshot bloquent tous les deux
          // (WKWebView + IndexedDB froid au premier lancement), on débloque après 6s
          const marchandFallback = setTimeout(() => setLoading(false), 6000);

          // getDoc immédiat — charge le marchand dès que possible sans attendre onSnapshot
          const tryGetMarchand = (attempt = 1) =>
            getDoc(marchandRef).then(snap => {
              clearTimeout(marchandFallback);
              if (snap.exists()) {
                setMarchand(prev => prev ?? ({ id: snap.id, actif: false, ...snap.data() } as MarchandData));
              }
              setLoading(false);
            }).catch(() => {
              if (attempt < 3) setTimeout(() => tryGetMarchand(attempt + 1), 800 * attempt);
              else { clearTimeout(marchandFallback); setLoading(false); }
            });
          tryGetMarchand();

          // onSnapshot garde le marchand à jour en temps réel
          unsubSnap = onSnapshot(
            marchandRef,
            (snap) => {
              clearTimeout(marchandFallback);
              if (snap.exists()) {
                setMarchand({ id: snap.id, actif: false, ...snap.data() } as MarchandData);
              } else {
                setMarchand(null);
              }
              setLoading(false);
            },
            () => { clearTimeout(marchandFallback); setLoading(false); }
          );
        } else {
          setMarchand(null);
          setLoading(false);
        }
      },
      // Erreur transitoire Firebase Auth (IndexedDB froid, ITP Safari) → reset
      // sans signOut() : le token peut être valide, on ne force pas la déconnexion
      () => {
        clearTimeout(fallback);
        setUser(null);
        setMarchand(null);
        setLoading(false);
      }
    );

    return () => {
      unsubAuth();
      unsubSnap?.();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, marchand, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
