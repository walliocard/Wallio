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
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "Wallio", {
    body: body || "",
    icon: icon || "/icon-192.png",
    badge: "/favicon-32.png",
  });
});
