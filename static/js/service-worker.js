// Service Worker für Schadensbericht App
const CACHE_NAME = 'schadensbericht-app-v1';
const OFFLINE_URL = '/offline.html';

// Liste der zu cachenden Assets
const urlsToCache = [
  '/',
  '/berichte',
  '/static/css/styles.css',
  '/static/css/pdf.css',
  '/static/js/database.js',
  '/static/js/form.js',
  '/static/js/pdf.js',
  '/static/manifest.json',
  'https://cdn.replit.com/agent/bootstrap-agent-dark-theme.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js',
  OFFLINE_URL
];

// Installation des Service Workers
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache geöffnet');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktivierung des Service Workers und Löschen alter Caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch-Handler für Offline-Zugriff
self.addEventListener('fetch', event => {
  // Prüfen, ob die Anfrage von der IndexedDB API stammt oder eine Navigation ist
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }
  
  // Strategie: Network First, dann Cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Wenn die Antwort gültig ist, eine Kopie im Cache speichern
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Bei Fehlern aus dem Cache bereitstellen
        return caches.match(event.request);
      })
  );
});