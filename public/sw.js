/* PWA 서비스 워커: 웹 푸시 수신 및 알림 클릭 */
self.addEventListener("push", function (event) {
  if (!event.data) return;
  let payload = { title: "도쿄민박", body: "", url: "/" };
  try {
    const data = event.data.json();
    payload = { ...payload, ...data };
  } catch {
    payload.body = event.data.text() || "새 알림이 있어요.";
  }
  const options = {
    body: payload.body || payload.title,
    icon: "/icon.png",
    badge: "/icon.png",
    data: { url: payload.url || "/" },
    tag: payload.tag || "default",
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.indexOf(self.location.origin) === 0 && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
