import { initializeApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence, inMemoryPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Détecte le mode privé Safari (localStorage bloqué ou quota 0)
function isPrivateMode(): boolean {
  try {
    const key = "__wallio_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return false;
  } catch {
    return true;
  }
}

const isNew = getApps().length === 0;
const app = isNew ? initializeApp(firebaseConfig) : getApps()[0];

// memoryLocalCache : Firestore sans IndexedDB — propre dans tous les contextes
export const db = isNew
  ? initializeFirestore(app, { localCache: memoryLocalCache() })
  : getFirestore(app);

export const auth = getAuth(app);

// Auth persistence : localStorage si possible, inMemory en mode privé Safari
if (isNew) {
  const persistence = isPrivateMode() ? inMemoryPersistence : browserLocalPersistence;
  setPersistence(auth, persistence).catch(() => {});
}

export const storage = getStorage(app);
