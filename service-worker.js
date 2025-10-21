const CACHE_NAME = 'faiz-gear-v1';
const urlsToCache = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  '5a.mp3',
  '5b.mp3',
  '5c.mp3',
  'standby.mp3',
  'charge.mp3',
  'complete.mp3',
  'error.mp3',
  'key_press.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }
        // なければネットワークから取得
        return fetch(event.request);
      })
  );
});
