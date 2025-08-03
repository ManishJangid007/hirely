// Service Worker for Hirely Interview App
const CACHE_NAME = 'hirely-interview-app-v1';
const urlsToCache = [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

// Fetch event
self.addEventListener('fetch', (event) => {
    // Handle manifest.json requests with theme parameter
    if (event.request.url.includes('manifest.json')) {
        event.respondWith(handleManifestRequest(event.request));
        return;
    }

    // Handle other requests
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Handle manifest requests with theme parameter
async function handleManifestRequest(request) {
    const url = new URL(request.url);
    const theme = url.searchParams.get('theme') || 'light';

    // Create manifest content based on theme
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

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
}); 