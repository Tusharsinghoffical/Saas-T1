/**
 * TASQ-ONE Service Worker (Zero AWS, lightweight offline caching engine)
 * Caches tasks, dashboards, and assets for complete offline read access.
 */

const CACHE_NAME = "tasq-one-cache-v2";
const STATIC_ASSETS = [
  "/",
  "/login",
  "/signup",
  "/manifest.json",
  "/icon.svg",
];

// 1. Install event: pre-cache static application shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Pre-cache non-fatal warning:", err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate event: clean up stale legacy caches immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch event
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignore non-GET or cross-origin analytics/APIs
  if (event.request.method !== "GET" || !url.origin.includes(self.location.origin)) {
    return;
  }

  // CRITICAL: NEVER cache Next.js runtime chunks, webpack HMR, or dynamic SSR scripts
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.includes("webpack") ||
    url.pathname.includes("hot-reloader") ||
    url.pathname.startsWith("/api/v1/health")
  ) {
    return;
  }

  // API Routes: Network-First with Cache Fallback for offline task list viewing
  if (url.pathname.startsWith("/api/v1/tasks") || url.pathname.startsWith("/api/v1/dashboard")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(
              JSON.stringify({
                success: true,
                data: [],
                offline: true,
                message: "You are currently offline. Showing cached tasks.",
              }),
              { headers: { "Content-Type": "application/json" } }
            );
          });
        })
    );
    return;
  }

  // Static Assets (icons, manifest, static images): Cache-first with network fallback
  if (
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname === "/manifest.json"
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
        );
      })
    );
    return;
  }
});
