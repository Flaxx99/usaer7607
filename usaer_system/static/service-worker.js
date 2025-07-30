// service-worker.js
const CACHE_NAME = 'usaer7607-cache-v3'; // Incrementamos la versión del caché
const urlsToCache = [
    '/',
    '/accounts/login/',
    '/static/offline.html', // Añadimos la página offline
    // CSS
    '/static/css/main_styles.css',
    '/static/soft-ui-dashboard/assets/css/soft-ui-dashboard.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css',
    'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css',
    'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.css',
    // JavaScript
    '/static/soft-ui-dashboard/assets/js/core/popper.min.js',
    '/static/soft-ui-dashboard/assets/js/core/bootstrap.min.js',
    '/static/soft-ui-dashboard/assets/js/plugins/perfect-scrollbar.min.js',
    '/static/soft-ui-dashboard/assets/js/plugins/smooth-scrollbar.min.js',
    '/static/soft-ui-dashboard/assets/js/soft-ui-dashboard.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js',
    'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/locales-all.global.min.js',
    // Imágenes (ejemplos, ajusta según las que uses)
    '/static/soft-ui-dashboard/assets/img/logo-ct.png',
    '/static/soft-ui-dashboard/assets/img/team-2.jpg',
    '/static/soft-ui-dashboard/assets/img/small-logos/logo-spotify.svg',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cache abierto durante la instalación');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Service Worker: Fallo al cachear URLs durante la instalación:', error);
            })
    );
});

self.addEventListener('fetch', event => {
    // Estrategia para solicitudes de navegación (páginas HTML)
    if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
        event.respondWith(
            fetch(event.request)
                .then(networkResponse => {
                    // Si la red responde, cacheamos y devolvemos la respuesta de red
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, networkResponse.clone());
                            });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Si la red falla, intentamos servir desde la caché
                    return caches.match(event.request)
                        .then(response => {
                            if (response) {
                                return response;
                            }
                            // Si no está en caché, devolvemos la página offline
                            return caches.match('/static/offline.html');
                        });
                })
        );
    } else {
        // Estrategia Cache-first para otros recursos (CSS, JS, imágenes, etc.)
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request)
                        .then(networkResponse => {
                            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                                caches.open(CACHE_NAME)
                                    .then(cache => {
                                        cache.put(event.request, networkResponse.clone());
                                    });
                            }
                            return networkResponse;
                        })
                        .catch(error => {
                            console.error('Service Worker: Fallo en la petición de red para recurso:', event.request.url, error);
                            // Podrías añadir un fallback para imágenes o otros recursos aquí
                        });
                })
        );
    }
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Eliminando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});