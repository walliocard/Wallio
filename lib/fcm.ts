"use client";

import { getMessaging, getToken } from "firebase/messaging";
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Enregistre le service worker FCM et retourne le token push.
 * Nécessite NEXT_PUBLIC_FIREBASE_VAPID_KEY dans les variables d'environnement.
 */
export async function registerFcmToken(): Promise<string | null> {
  try {
    // Vérifie la compatibilité
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return null;
    if (Notification.permission !== "granted") return null;

    // Enregistre le service worker depuis la route API (config injectée)
    const registration = await navigator.serviceWorker.register("/api/firebase-sw", {
      scope: "/",
    });

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const messaging = getMessaging(app);

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("Wallio FCM: NEXT_PUBLIC_FIREBASE_VAPID_KEY manquant");
      return null;
    }

    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    return token || null;
  } catch (err) {
    console.error("Wallio FCM registration error:", err);
    return null;
  }
}
