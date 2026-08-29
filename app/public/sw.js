/**
 * Service Worker - Hcare PWA
 *
 * Chiến lược AN TOÀN, ưu tiên dữ liệu mới:
 * - /api/           → luôn qua mạng, KHÔNG cache (số liệu tiền bạc phải mới)
 * - điều hướng trang → mạng trước, mất mạng mới dùng bản cache
 * - /assets/ (file build có hash) → cache trước (bất biến, an toàn)
 */

const CACHE = 'hcare-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/') || url.pathname === '/health') return; // network only

  // Assets có hash trong tên: cache-first
  if (url.pathname.startsWith('/assets/') || url.pathname.match(/\.(png|svg|ico|webmanifest)$/)) {
    event.respondWith(
      caches.match(event.request).then(
        (hit) =>
          hit ||
          fetch(event.request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((c) => c.put(event.request, clone));
            }
            return res;
          })
      )
    );
    return;
  }

  // Điều hướng trang: network-first, offline thì trả bản cache gần nhất
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put('/', clone));
          return res;
        })
        .catch(() => caches.match('/'))
    );
  }
});
