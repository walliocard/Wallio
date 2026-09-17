import { initializeApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isNew = getApps().length === 0;
const app = isNew ? initializeApp(firebaseConfig) : getApps()[0];

// memoryLocalCache : désactive IndexedDB complètement.
// Cause du bug : le cache IndexedDB se corrompt entre sessions → Firestore
// se bloque en essayant de le réconcilier (visible : marche en navigation privée,
// pas en normale). Avec la mémoire seule : toujours propre, jamais de corruption.
export const db = isNew
  ? initializeFirestore(app, { localCache: memoryLocalCache() })
  : getFirestore(app);

export const auth = getAuth(app);
export const storage = getStorage(app);
