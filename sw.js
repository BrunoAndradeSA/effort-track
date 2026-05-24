const CACHE = "effort-track-v1";

const PRECACHE = [
  "./",
  "./index.html",
  "./index.css",
  "./favicon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./js/main.js",
  "./js/utils/timeUtils.js",
  "./js/parser/lexer.js",
  "./js/parser/parser.js",
  "./js/parser/evaluator.js",
  "./js/services/effortCalculator.js",
  "./js/ui/hoursUi.js",
  "./js/ui/effortUi.js",
  "./js/ui/dateDiffUi.js",
  "./js/ui/testUi.js",
  "./js/ui/theme.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
