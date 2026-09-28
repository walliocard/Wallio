self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(clients.claim()));

self.addEventListener("push", event => {
  if (!event.data) return;
  let payload = {};
  try { payload = event.data.json(); } catch { return; }

  const n = payload.notification || {};
  const d = payload.data || {};
  const title = n.title || d.title || "Wallio";
  const body  = n.body  || d.body  || "";
  const icon  = n.icon  || d.icon  || "/icon-192.png";
  const url   = d.url   || "/mes-cartes";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: "/favicon-32.png",
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/mes-cartes";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes("walliocard.com") && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
