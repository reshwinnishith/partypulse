const CACHE = 'partypulse-v1'
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/']))); self.skipWaiting() })
self.addEventListener('activate', e => { self.clients.claim() })
self.addEventListener('fetch', e => {
  if (e.request.url.includes('firebase') || e.request.url.includes('googleapis')) return
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)))
})
