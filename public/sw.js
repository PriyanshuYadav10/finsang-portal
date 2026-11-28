/* Finsang service worker: always uses the live site; shows offline.html when there is no connection. */
const CACHE = 'finsang-offline-v1';
const OFFLINE = ['/offline.html', '/img/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(OFFLINE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return; // API, scripts, images: straight to the network
  e.respondWith(fetch(e.request).catch(() => caches.match('/offline.html')));
});
