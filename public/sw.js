// Caches only immutable static assets (hashed Next.js chunks, PWA icons). Deliberately
// does NOT touch page navigations, RSC payloads, or server actions — this app shows live
// financial data and Next's App Router relies on its own fetch semantics for those, so
// caching them here would risk serving stale data or breaking prefetch/navigation.
const CACHE_NAME = "expense-tracker-static-v2";

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

// Hashed chunks from old deployments are never requested again, so cap the cache and drop the
// oldest entries (Cache.keys() returns them in insertion order) instead of growing forever.
const MAX_ENTRIES = 150;

async function put(request, response) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES)).map((key) => cache.delete(key)));
}

// only a genuine success is worth keeping -- a transient 404/500 must never be served from cache
function fetchAndCache(request) {
  return fetch(request).then((response) => {
    if (response.ok) put(request, response.clone());
    return response;
  });
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (!isCacheableStatic(event.request, url)) return;

  if (url.pathname.startsWith("/icons/")) {
    // not content-hashed, so serve the cached copy fast but refresh it in the background
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const refreshed = fetchAndCache(event.request);
        if (cached) {
          event.waitUntil(refreshed.catch(() => {}));
          return cached;
        }
        return refreshed;
      }),
    );
    return;
  }

  // /_next/static/ filenames are content-hashed, so a cached copy is always still correct
  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetchAndCache(event.request)));
});
