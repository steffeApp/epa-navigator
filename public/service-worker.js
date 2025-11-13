self.addEventListener("install", () => {
  console.log("🧱 Service worker installerad");
});

self.addEventListener("fetch", (event) => {
  // Här kan du lägga till caching senare om du vill
});
// 🧱 Enkel service worker för offline-cache av EPA Navigator
const CACHE_NAME = "epa-navigator-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// 📦 Installera SW och cacha grundfiler
self.addEventListener("install", (event) => {
  console.log("🛠️ Installerar service worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 Cachar resurser:", ASSETS);
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// ⚡ Aktivera ny SW och rensa gamla cachear
self.addEventListener("activate", (event) => {
  console.log("⚡ Aktiverar ny service worker...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 🌐 Fånga fetch-förfrågningar (offline-stöd)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() =>
          caches.match("/index.html") // fallback offline
        )
      );
    })
  );
});
