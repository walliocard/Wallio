import { NextResponse } from "next/server";

// Sert le service worker FCM avec les variables d'environnement injectées
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  const sw = `
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(config)});

const messaging = firebase.messaging();

// onBackgroundMessage est appelé pour les messages data-only (pas de champ notification)
// ce qui nous donne le controle total sur l'affichage (icone marchand, click action)
messaging.onBackgroundMessage(payload => {
  const data = payload.data || {};
  self.registration.showNotification(data.title || "Wallio", {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: "/favicon-32.png",
    data: { url: data.url || "/mes-cartes" },
  });
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/mes-cartes";
  event.waitUntil(clients.openWindow(url));
});
`;

  return new NextResponse(sw, {
    headers: {
      "Content-Type": "application/javascript",
      "Service-Worker-Allowed": "/",
      "Cache-Control": "no-cache",
    },
  });
}
