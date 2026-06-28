// Network-first: sempre tenta a rede, usa cache só se offline
const CACHE = 'cafe-e-tal-v3';

self.addEventListener('install', e => {
  // Cacheia só os arquivos locais essenciais
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['./index.html', './manifest.json', './icon-192.png', './icon-512.png'])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // CDNs externos (Firebase, Babel, unpkg): sempre network, sem cache
  const url = e.request.url;
  if (
    url.includes('gstatic.com') ||
    url.includes('googleapis.com') ||
    url.includes('unpkg.com') ||
    url.includes('firebaseapp.com') ||
    url.includes('firestore.googleapis.com')
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Arquivos locais: network-first, fallback para cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
