self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {
    title: "Novo agendamento",
    body: "Voce recebeu um novo agendamento.",
    url: "/admin"
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.svg",
      badge: "/icons/icon-192.svg",
      data: {
        url: data.url ?? "/admin"
      }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/admin";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
