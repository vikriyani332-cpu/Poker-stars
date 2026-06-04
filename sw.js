/**
 * Sadewa Corp Score Cekih Service Worker Cache Engine
 */
const CACHE_NAME_VERSIONED = "sadewa-cekih-v1";
const ASSETS_TO_CACHE_LIST = [
    "index.html",
    "style.css",
    "app.js",
    "manifest.json",
    "classic-192.png",
    "classic-512.png",
    "godofgambler.wav",
    "dimulaidari0.wav"
];

// Installs and registers asset structures into disk tables caches
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME_VERSIONED).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE_LIST);
        })
    );
    self.skipWaiting();
});

// Clears obsolete legacy caches blocks when activating updates
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME_VERSIONED) {
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// Responds with cache matches instantly fallback to network pipelines seamlessly
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});
