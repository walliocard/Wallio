"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
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
    let unsubAuth: (() => void) | null = null;
    let marchandTimer: ReturnType<typeof setTimeout> | null = null;

    // authStateReady() (Firebase 12) se résout quand Firebase a terminé de lire
    // la session depuis localStorage/sessionStorage. Évite le faux null initial
    // qui déclencherait un redirect vers connexion avant la restauration de session.
    // Filet : si ça ne répond pas en 8 s, on débloque quand même.
    const readyFallback = setTimeout(() => setLoading(false), 8000);

    auth.authStateReady().then(() => {
      clearTimeout(readyFallback);

      unsubAuth = onAuthStateChanged(
        auth,
        (u) => {
          setUser(u);
          unsubSnap?.();
          unsubSnap = null;
          if (marchandTimer) { clearTimeout(marchandTimer); marchandTimer = null; }

          if (u) {
            // Remet loading=true pour les navigations client-side (router.push)
            setLoading(true);
            const marchandRef = doc(db, "marchands", u.uid);
            marchandTimer = setTimeout(() => setLoading(false), 10000);

            const tryGetMarchand = (attempt = 1) =>
              getDoc(marchandRef).then(snap => {
                if (snap.exists()) {
                  if (marchandTimer) { clearTimeout(marchandTimer); marchandTimer = null; }
                  setMarchand(prev => prev ?? ({ id: snap.id, actif: false, ...snap.data() } as MarchandData));
                  setLoading(false);
                }
              }).catch(() => {
                if (attempt < 3) setTimeout(() => tryGetMarchand(attempt + 1), 800 * attempt);
                else { if (marchandTimer) { clearTimeout(marchandTimer); marchandTimer = null; } setLoading(false); }
              });
            tryGetMarchand();

            unsubSnap = onSnapshot(
              marchandRef,
              (snap) => {
                if (snap.exists()) {
                  if (marchandTimer) { clearTimeout(marchandTimer); marchandTimer = null; }
                  setMarchand({ id: snap.id, actif: false, ...snap.data() } as MarchandData);
                  setLoading(false);
                } else if (!snap.metadata.fromCache) {
                  if (marchandTimer) { clearTimeout(marchandTimer); marchandTimer = null; }
                  setMarchand(null);
                  setLoading(false);
                }
                // fromCache=true + !exists → ignoré, on attend le serveur
              },
              () => { if (marchandTimer) { clearTimeout(marchandTimer); marchandTimer = null; } setLoading(false); }
            );
          } else {
            setMarchand(null);
            setLoading(false);
          }
        },
        () => {
          setUser(null);
          setMarchand(null);
          setLoading(false);
        }
      );
    }).catch(() => setLoading(false));

    return () => {
      clearTimeout(readyFallback);
      unsubAuth?.();
      unsubSnap?.();
      if (marchandTimer) clearTimeout(marchandTimer);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, marchand, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
