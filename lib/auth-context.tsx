"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import { getMarchand } from "./firestore";

type MarchandData = {
  id: string;
  nom: string;
  actif: boolean;
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
        const data = await getMarchand(u.uid);
        setMarchand(data as MarchandData | null);
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
