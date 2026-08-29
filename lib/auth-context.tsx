"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import { getMarchand } from "./firestore";

type MarchandData = {
  id: string;
  nom: string;
  actif: boolean;
  objectif_tampons: number;
  nom_recompense: string;
  mode_recompense: "cyclique" | "progressif";
  paliers?: Array<{ tampons: number; recompense: string }>;
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
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const timeout = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("getMarchand timeout")), 8000)
          );
          const data = await Promise.race([getMarchand(u.uid), timeout]);
          setMarchand(data as MarchandData | null);
        } catch (e) {
          console.error("[auth] getMarchand failed:", e);
          setMarchand(null);
        }
      } else {
        setMarchand(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ user, marchand, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
