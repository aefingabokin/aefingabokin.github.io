/* Service worker: appið opnast án nets og bíður ekki eftir lélegu neti.
   Eigin skrár: net fyrst, en afritið tekur við ef netið svarar ekki innan NET_WAIT (ræktin í kjallara) eða er úti.
   Firebase-kóðinn, Excel-hlutinn og letrið: afrit fyrst (útgáfurnar eru festar) og fylgja með milli útgáfa. */
const CACHE = 'aefingabokin-v67';
const SHELL = ['./', './index.html', './js/main.js', './js/ui.js', './js/store.js', './js/settings.js', './js/importers.js', './js/pools.js', './js/coach.js', './js/keypad.js', './js/i18n.js', './js/firebase-config.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

const NET_WAIT = 3000;
let cacheModeUntil = 0;   /* síðan sjálf kom úr afriti: skrárnar hennar koma þá líka úr afriti, svo útgáfur blandist ekki */

const isPinned = url => (url.origin === 'https://www.gstatic.com' && url.pathname.startsWith('/firebasejs/'))
  || (url.origin === 'https://cdnjs.cloudflare.com' && url.pathname.startsWith('/ajax/libs/xlsx/'))
  || url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com';
/* Aðeins heil svör fara í afritið (ekki 404 eða villusíður); ógegnsæ svör frá öðrum lénum eru tekin gild */
const keep = (req, res) => { if (res && (res.ok || res.type === 'opaque')){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); } return res; };
const fromNet = req => fetch(req).then(res => keep(req, res));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const old = (await caches.keys()).filter(k => k !== CACHE);
    /* Festar skrár (Firebase, letur) flytjast úr eldra afriti svo ný útgáfa þurfi ekki að sækja þær aftur */
    try {
      const fresh = await caches.open(CACHE);
      for (const k of old){
        const c = await caches.open(k);
        for (const req of await c.keys()){
          if (!isPinned(new URL(req.url)) || await fresh.match(req)) continue;
          const res = await c.match(req); if (res) await fresh.put(req, res);
        }
      }
    } catch (err) { /* afritin eru aðeins flýting; án þeirra er sótt af netinu */ }
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (isPinned(url)) {
    e.respondWith(caches.match(req).then(hit => hit || fromNet(req)));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const nav = req.mode === 'navigate';
    const cached = () => caches.match(req, { ignoreSearch: true }).then(hit => hit || (nav ? caches.match('./index.html') : undefined));
    if (!nav && Date.now() < cacheModeUntil){
      const hit = await cached();
      if (hit){ e.waitUntil(fromNet(req).catch(() => {})); return hit; }   /* afritið strax, netið uppfærir það í bakgrunni */
    }
    const net = fromNet(req);
    let res = null;
    try { res = await Promise.race([net, new Promise(r => setTimeout(r, NET_WAIT, null))]); } catch (err) { /* netlaust */ }
    if (res && res.ok) return res;
    const hit = await cached();
    if (hit){
      if (nav) cacheModeUntil = Date.now() + 20000;
      e.waitUntil(net.catch(() => {}));   /* seint svar uppfærir afritið fyrir næstu opnun */
      return hit;
    }
    return res || net;   /* ekkert afrit: villusvarið eins og það er, eða beðið áfram eftir netinu */
  })());
});
