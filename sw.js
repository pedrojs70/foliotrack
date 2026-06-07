const CACHE_NAME = 'foliotrack-v1';
const ASSETS = [
  '/',
  '/index.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network first — always get fresh data from Firebase and live prices
  // Fall back to cache only for the app shell
  if (e.request.url.includes('firestore') ||
      e.request.url.includes('googleapis') ||
      e.request.url.includes('twelvedata') ||
      e.request.url.includes('coingecko') ||
      e.request.url.includes('workers.dev') ||
      e.request.url.includes('er-api')) {
    // Always network for API calls
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
