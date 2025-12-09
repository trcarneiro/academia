const CACHE_NAME = 'portal-v1';
const STATIC_ASSETS = [
  '/portal/',
  '/portal/index.html',
  '/js/portal/app.js',
  '/js/portal/router.js',
  '/js/portal/api.js',
  '/css/portal/base.css',
  '/css/portal/layout.css',
  '/css/portal/components.css',
  '/css/portal/pages/dashboard.css',
  '/css/portal/pages/login.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API: Network Only
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // HTML: Network First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/portal/index.html'))
    );
    return;
  }

  // Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});