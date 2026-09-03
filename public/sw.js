// Caches only immutable static assets (hashed Next.js chunks, PWA icons). Deliberately
// does NOT touch page navigations, RSC payloads, or server actions — this app shows live
// financial data and Next's App Router relies on its own fetch semantics for those, so
// caching them here would risk serving stale data or breaking prefetch/navigation.
const CACHE_NAME = "expense-tracker-static-v1";

function isCacheableStatic(request, url) {
  if (request.method !== "GET") return false;
  return url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (!isCacheableStatic(event.request, url)) return;

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ??
        fetch(event.request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        }),
    ),
  );
});
