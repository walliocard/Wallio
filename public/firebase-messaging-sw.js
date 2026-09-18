importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Les variables sont injectées par /api/sw-config au chargement
firebase.initializeApp({
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY_PLACEHOLDER",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_PLACEHOLDER",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID_PLACEHOLDER",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_PLACEHOLDER",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID_PLACEHOLDER",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  // Les messages /api/notify sont data-only — lire payload.data en priorité
  const n = payload.notification || {};
  const d = payload.data || {};
  const title = n.title || d.title || "Wallio";
  const body  = n.body  || d.body  || "";
  const icon  = n.icon  || d.icon  || "/icon-192.png";
  const url   = d.url   || d.link  || "https://app.walliocard.com/mes-cartes";

  self.registration.showNotification(title, {
    body,
    icon,
    badge: "/favicon-32.png",
    data: { url },
  });
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "https://app.walliocard.com/mes-cartes";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      // Focalise une fenêtre déjà ouverte si possible
      for (const client of list) {
        if (client.url.startsWith("https://app.walliocard.com") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
