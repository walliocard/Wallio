import { initializeApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore, memoryLocalCache, persistentLocalCache } from "firebase/firestore";
import { getAuth, initializeAuth, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } from "firebase/auth";
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

// Pages publiques (clients) → memoryLocalCache : évite tout blocage IndexedDB
// sur un nouvel appareil. Les pages dashboard gardent persistentLocalCache
// pour le support hors-ligne du marchand.
function isPublicClientPage(): boolean {
  if (typeof window === "undefined") return false;
  return /^\/(nfc|client|ref|inscription|mes-cartes|preferences|choisir)/.test(
    window.location.pathname
  );
}

function isCapacitor(): boolean {
  return typeof window !== "undefined" && "Capacitor" in window;
}

// iOS (web Safari + Capacitor WKWebView) : IndexedDB freeze au chargement
// → memoryLocalCache + browserSessionPersistence évitent le blocage.
function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iP(hone|ad|od)/i.test(navigator.userAgent) || isCapacitor();
}

const isNew = getApps().length === 0;
const app = isNew ? initializeApp(firebaseConfig) : getApps()[0];

const localCache =
  typeof window === "undefined" || isPrivateMode() || isPublicClientPage() || isIOS()
    ? memoryLocalCache()
    : persistentLocalCache();

export const db = isNew
  ? initializeFirestore(app, {
      localCache,
      // Détecte automatiquement si WebSocket est bloqué par l'opérateur mobile
      // et bascule en HTTP long polling en quelques secondes (au lieu de ~8 min).
      experimentalAutoDetectLongPolling: true,
    })
  : getFirestore(app);

// initializeAuth sans popupRedirectResolver évite l'iframe __/auth/iframe
// qui n'existe pas sur Vercel et bloque Firebase Auth init en Safari
const _persistence = typeof window !== "undefined" && isPrivateMode()
  ? inMemoryPersistence
  : typeof window !== "undefined" && isIOS()
  ? browserSessionPersistence
  : browserLocalPersistence;

export const auth = isNew
  ? initializeAuth(app, { persistence: _persistence })
  : getAuth(app);

export const storage = getStorage(app);
