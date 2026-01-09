/* eslint-disable no-restricted-globals */
// Service Worker for Paw Protector PWA

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `paw-protector-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `paw-protector-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `paw-protector-images-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API endpoints that should use network-first strategy
const API_ENDPOINTS = [
  '/api/pets',
  '/api/chat',
  '/api/vaccinations',
  '/api/dewormings',
  '/api/diseases',
  '/api/metrics',
  '/api/anomalies',
  '/api/care',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('paw-protector-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin && !url.href.includes('/api/')) {
    return;
  }

  // API requests - network first, fallback to cache
  if (isAPIRequest(url.pathname)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Images - cache first, fallback to network
  if (isImageRequest(request)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Static assets - cache first, fallback to network
  event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
});

// Background sync for queued requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'sync-pet-data') {
    event.waitUntil(syncPetData());
  }
});

// Push notifications (for future enhancement)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Paw Protector';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// Helper: Check if request is for API
function isAPIRequest(pathname) {
  return API_ENDPOINTS.some(endpoint => pathname.includes(endpoint));
}

// Helper: Check if request is for image
function isImageRequest(request) {
  return request.destination === 'image' || 
         request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
}

// Strategy: Cache first, fallback to network
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      return cachedResponse;
    }

    console.log('[SW] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first strategy failed:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline');
      if (offlineResponse) return offlineResponse;
    }

    throw error;
  }
}

// Strategy: Network first, fallback to cache
async function networkFirstStrategy(request) {
  try {
    console.log('[SW] Network first:', request.url);
    const networkResponse = await fetch(request);

    // Cache successful GET requests
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, checking cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Returning cached response');
      return cachedResponse;
    }

    console.error('[SW] Network-first strategy failed completely:', error);
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'offline', 
        message: 'You are currently offline. Changes will sync when connection is restored.' 
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Sync queued pet data when connection restores
async function syncPetData() {
  console.log('[SW] Syncing pet data...');
  
  try {
    // This will be triggered by the syncService
    // The actual sync logic is handled by the frontend
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_TRIGGERED',
        timestamp: Date.now()
      });
    });

    console.log('[SW] Sync notification sent to all clients');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

// Message handler for skip waiting
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }
});

console.log('[SW] Service worker loaded');
