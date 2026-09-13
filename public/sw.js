/**
 * STable service worker.
 *
 * Strategy:
 *  - App shell (static assets, JS/CSS chunks): cache-first, so the app
 *    loads instantly offline/on flaky connections.
 *  - Navigations (HTML pages): network-first with cache fallback, so
 *    users see fresh content when online but the app still opens
 *    offline (showing the last-cached version of the page).
 *  - API/data requests (Supabase, /api/*): always network-only. We
 *    never cache financial data in the service worker cache — showing
 *    stale balances/transactions would be actively misleading. Offline
 *    write-queueing for mutations is a future enhancement (see
 *    ARCHITECTURE.md section on offline resilience); for now, failed
 *    writes surface a clear "network unavailable" error to the user.
 */

const CACHE_NAME = "stable-shell-v3";
const APP_SHELL = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isDataRequest(url) {
  return (
    url.pathname.startsWith("/api/") ||
    url.hostname.endsWith(".supabase.co")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (isDataRequest(url)) {
    // Network-only for anything data-related — never serve stale
    // financial data from cache.
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((res) => res || caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && (url.origin === self.location.origin)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
