const CACHE_NAME = 'academia-krav-maga-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/login.html',
    '/images/icon.svg',
    '/css/force-reset.css',
    '/css/layout-center-fix.css'
];

// Install Event - Pre-cache critical assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Pre-caching offline pages');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting(); // Force activation immediately
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Handling requests
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. API Requests -> Network Only (Don't cache sensitive/dynamic data)
    if (url.pathname.startsWith('/api/')) {
        return; // Browser default (Network)
    }

    // 2. Navigation Requests (HTML) -> Network First, Fallback to Cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match(event.request)
                        .then((response) => {
                            if (response) return response;
                            // If not found in cache and network fails, return index.html (SPA support)
                            return caches.match('/index.html');
                        });
                })
        );
        return;
    }

    // 3. Static Assets (CSS, JS, Images) -> Stale-While-Revalidate
    // Serve from cache immediately, then update cache in background
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Check if valid response
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // Clone and update cache
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch((err) => {
                // Network failed, nothing to do if we don't have cache.
                // If we have cache (cachedResponse), it was already returned.
                return cachedResponse;
            });

            return cachedResponse || fetchPromise;
        })
    );
});
