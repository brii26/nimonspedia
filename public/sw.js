self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(self.clients.claim());
});

// 1. Event saat Server mengirim Push Notification
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[Service Worker] Push received without data');
    return;
  }

  const data = event.data.json();
  console.log('[Service Worker] Push Received:', data);

  const title = data.title || 'Nimonspedia Notification';
  const options = {
    body: data.body || 'You have a new message',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/'
    },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 2. Event saat User klik notifikasi
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received.');

  event.notification.close(); // Tutup notifikasi

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Cek apakah ada tab yang sudah terbuka di URL tersebut?
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus(); // Fokus ke tab yang ada
        }
      }
      // Jika tidak ada, buka window baru
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});