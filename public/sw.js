// Service Worker for Hirely Interview App
const CACHE_NAME = 'hirely-interview-app-v1';
const STATIC_CACHE = 'hirely-static-v1';
const DYNAMIC_CACHE = 'hirely-dynamic-v1';

// Files to cache for offline functionality
const urlsToCache = [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
    '/apple-touch-icon.png',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Opened static cache');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Claim all clients to ensure the new service worker takes control
            return self.clients.claim();
        })
    );
});

// Fetch event - handle caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle manifest.json requests with theme parameter
    if (url.pathname === '/manifest.json') {
        event.respondWith(handleManifestRequest(request));
        return;
    }

    // Handle static assets (JS, CSS, images)
    if (url.pathname.startsWith('/static/') ||
        url.pathname.includes('.js') ||
        url.pathname.includes('.css') ||
        url.pathname.includes('.png') ||
        url.pathname.includes('.ico')) {
        event.respondWith(handleStaticAssets(request));
        return;
    }

    // Handle HTML and navigation requests
    if (request.destination === 'document' || request.mode === 'navigate') {
        event.respondWith(handleNavigation(request));
        return;
    }

    // Handle other requests with network-first strategy
    event.respondWith(handleOtherRequests(request));
});

// Handle manifest requests with theme parameter
async function handleManifestRequest(request) {
    const url = new URL(request.url);
    const theme = url.searchParams.get('theme') || 'light';

    const manifest = {
        short_name: "Hirely",
        name: "Hirely - Interview Management App",
        description: "Modern Candidate Interview Management App - Manage interviews, questions, and results",
        icons: [
            {
                src: "favicon.ico",
                sizes: "64x64 32x32 24x24 16x16",
                type: "image/x-icon"
            },
            {
                src: "favicon-16x16.png",
                type: "image/png",
                sizes: "16x16"
            },
            {
                src: "favicon-32x32.png",
                type: "image/png",
                sizes: "32x32"
            },
            {
                src: "android-chrome-192x192.png",
                type: "image/png",
                sizes: "192x192",
                purpose: "any maskable"
            },
            {
                src: "android-chrome-512x512.png",
                type: "image/png",
                sizes: "512x512",
                purpose: "any maskable"
            },
            {
                src: "apple-touch-icon.png",
                type: "image/png",
                sizes: "180x180"
            }
        ],
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: theme === 'dark' ? "#1f2937" : "#ffffff",
        background_color: theme === 'dark' ? "#111827" : "#ffffff",
        categories: [
            "business",
            "productivity"
        ],
        lang: "en",
        dir: "ltr"
    };

    return new Response(JSON.stringify(manifest), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        }
    });
}

// Handle static assets with cache-first strategy
async function handleStaticAssets(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // If network fails and we have a cached version, return it
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Handle navigation requests with network-first strategy
async function handleNavigation(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Cache the response for offline use
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // If network fails, try to serve from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        // If no cached version, return a basic offline page
        return new Response(
            '<html><body><h1>Offline</h1><p>Please check your connection and try again.</p></body></html>',
            {
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }
}

// Handle other requests with network-first strategy
async function handleOtherRequests(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // If network fails, try to serve from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
}); 