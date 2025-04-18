// service-worker.js

const CACHE_NAME = 'tambo-cache-v6';
const urlsToCache = [
  './',
  './index.html',
  './menu.html',
  './formulario.html',
  './styles.css',
  './menu.css',
  './formulario.css',
  './menu.js',
  './formulario.js',
  './app.js',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación: cachear recursos esenciales
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Archivos cacheados:', urlsToCache);
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Estrategia "stale-while-revalidate" con fallback mejorado
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const cachedResponse = await caches.match(event.request);
    try {
      const networkResponse = await fetch(event.request);
      if (networkResponse && networkResponse.status === 200) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      if (cachedResponse) return cachedResponse;
      if (event.request.mode === 'navigate') return caches.match('./index.html');
      if (event.request.destination === 'image') return caches.match('./icon-192.png');
      return Response.error();
    }
  })());
});

// Activación: limpiar cachés antiguos y reclamar clientes
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME) {
          console.log('Eliminando caché antiguo:', cacheName);
          return caches.delete(cacheName);
        }
      })
    );
    self.clients.claim();
  })());
});
