const CACHE_NAME = 'photographers-v0.5'; // رفع رقم الإصدار لإجبار المتصفح على التحديث
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // فرض التثبيت الفوري
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key); // حذف الكاش القديم بالكامل
        }
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
