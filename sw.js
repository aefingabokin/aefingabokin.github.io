/* Einfaldur service worker: appið opnast án nets.
   Eigin skrár: net fyrst, annars afrit. Firebase-kóðinn og Excel-hlutinn: afrit fyrst (útgáfurnar eru festar). */
const CACHE = 'aefingabokin-v31';
const SHELL = ['./', './index.html', './js/main.js', './js/ui.js', './js/store.js', './js/settings.js', './js/importers.js', './js/pools.js', './js/firebase-config.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const pinned = (url.origin === 'https://www.gstatic.com' && url.pathname.startsWith('/firebasejs/'))
    || (url.origin === 'https://cdnjs.cloudflare.com' && url.pathname.startsWith('/ajax/libs/xlsx/'));
  if (pinned) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(req).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html'))));
});
