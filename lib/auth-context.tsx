"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";
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

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      clearTimeout(fallback);
      setUser(u);

      // Annuler l'éventuel snapshot précédent
      unsubSnap?.();
      unsubSnap = null;

      if (u) {
        // onSnapshot garde le marchand toujours à jour
        unsubSnap = onSnapshot(
          doc(db, "marchands", u.uid),
          (snap) => {
            if (snap.exists()) {
              setMarchand({ id: snap.id, ...snap.data() } as MarchandData);
            } else {
              setMarchand(null);
            }
            setLoading(false);
          },
          () => { setMarchand(null); setLoading(false); }
        );
      } else {
        setMarchand(null);
        setLoading(false);
      }
    });

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
