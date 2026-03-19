const CACHE_NAME = 'cozy-fit-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Handle share target — redirect /share to / with query params preserved
  if (url.pathname === '/share') {
    const params = url.searchParams.toString();
    e.respondWith(Response.redirect(`/?${params}&shared=1`, 303));
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((response) => {
        // Cache successful GET requests
        if (e.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
