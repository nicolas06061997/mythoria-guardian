// MYTHORIA Guardian — fonctionne hors ligne (dernières données gardées) et se met à jour tout seul.
const CACHE = 'guardian-v2';
const SHELL = ['./', './index.html', './app.css', './app.js', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('guardian-') && x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
// Réseau d'abord (toujours la dernière version et les dernières données), copie locale si pas de connexion.
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.hostname === 'api.github.com') return; // état « contrôle en cours » : jamais de copie
  const mine = url.origin === location.origin && url.pathname.startsWith(new URL('./', self.registration.scope).pathname);
  const data = url.hostname === 'raw.githubusercontent.com';
  if (!mine && !data) return;
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => {
    if (r.ok) { const copy = r.clone(); const key = data ? url.origin + url.pathname : req; caches.open(CACHE).then(c => c.put(key, copy)); }
    return r;
  }).catch(() => caches.match(data ? url.origin + url.pathname : req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
