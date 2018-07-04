const OFFLINE_CACHE_NAME = 'offline';
const FONTS_CACHE_NAME = 'fonts';
const ALLOWED_CACHES = [OFFLINE_CACHE_NAME, FONTS_CACHE_NAME];

const OFFLINE_ASSETS = [
  'index.html',
  '/',
  'waterloo.png',
  'main.css',
  'main.js',
  'manifest.webmanifest',
  'https://fonts.googleapis.com/css?family=Shadows+Into+Light'
];

self.addEventListener('install', installEvent => {
  installEvent.waitUntil((async () => {
    const offlineCache = await caches.open(OFFLINE_CACHE_NAME);
    await offlineCache.addAll(OFFLINE_ASSETS);
    return skipWaiting();
  })());
});

self.addEventListener('activate', activateEvent => {
  activateEvent.waitUntil((async () => {
    const keys = await caches.keys();
    await keys.map(async cache => {
      if (!ALLOWED_CACHES.includes(cache)) {
        await caches.delete(cache);
      }
    });
    return clients.claim();
  })());
});

self.addEventListener('fetch', fetchEvent => {
  fetchEvent.respondWith((async () => {
    const req = fetchEvent.request;
    if (req.destination) {
      console.log(`${req.url} (${req.destination})`);
      switch(req.destination) {
        // Cache-first
        case 'font':
          return(cacheFirst(req));
        // Stale-while-revalidate
        default:
          return(staleWhileRevalidate(req));
      }
    }
    // XHR and fetch
    return fetch(req);
  })());
});

const cacheFirst = async (req) => {
  const fontsCache = await caches.open(FONTS_CACHE_NAME);
  const cacheHit = await fontsCache.match(req);
  if (cacheHit) {
    return cacheHit;
  }
  const fontCache = await caches.open(FONTS_CACHE_NAME);
  const font = await fetch(req);
  await fontCache.put(req.url, font.clone());
  return font;
};

const staleWhileRevalidate = async(req) => {
  const offlineCache = await caches.open(OFFLINE_CACHE_NAME);
  const cacheHit = offlineCache.match(req);
  const fetchPromise = fetch(req).then(networkResponse => {
    offlineCache.put(req, networkResponse.clone());
    return networkResponse;
  });
  return cacheHit || fetchPromise;
};
