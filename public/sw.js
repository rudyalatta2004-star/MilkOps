/**
 * Service Worker de APPVACA.
 * Estrategia stale-while-revalidate para recursos del mismo origen:
 * sirve al instante desde caché (RNF-05) y actualiza en segundo plano.
 * Los datos ya viven en IndexedDB, así que esto cubre el "app shell"
 * para que la app cargue sin conexión (RNF-01).
 */
const CACHE = "appvaca-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);

      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch(() => cached);

      return cached || network;
    })(),
  );
});
