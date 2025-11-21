// service-worker.js
const CACHE_VERSION = "v1.1.1"; 
const CACHE_NAME = `epa-cache-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(key => key !== CACHE_NAME && caches.delete(key))
      );

      await self.clients.claim();

      // Skicka update-notis till alla tabs
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
      }
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  // Navigation: Network first
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
          return response;
        } catch {
          const cached = await caches.match(request);
          return cached || caches.match('/offline.html');
        }
      })()
    );
    return;
  }

  // Assets: Cache first, update in background
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) {
        event.waitUntil(
          caches.open(CACHE_NAME).then(async (cache) => {
            try {
              const fresh = await fetch(request);
              await cache.put(request, fresh.clone());
            } catch {}
          })
        );
        return cached;
      }

      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
        return response;
      } catch {
        return caches.match('/offline.html');
      }
    })()
  );
});
