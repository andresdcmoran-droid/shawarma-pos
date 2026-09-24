// Service Worker para Notificaciones de Sistema en Pantalla Bloqueada
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_READY_NOTIFICATION') {
    const title = event.data.title || '🌯 ¡Tu Shawarma está Listo!';
    const options = {
      body: event.data.body || 'Su orden está lista. Le invitamos a pasar a retirarla.',
      icon: 'images/brand-icon.png',
      badge: 'images/brand-icon.png',
      vibrate: [300, 200, 300, 200, 500],
      tag: 'order-ready-' + (event.data.turn || Date.now()),
      renotify: true,
      requireInteraction: true,
      data: { url: event.data.url || '/' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data?.url || '/');
    })
  );
});
