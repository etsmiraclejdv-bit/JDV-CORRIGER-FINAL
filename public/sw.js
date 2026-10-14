/* JDV CRM service worker.
 * Intentionally does not cache API requests, authenticated HTML, Supabase responses,
 * tokens, or user-specific records. Full offline transactions require a separate
 * authorized IndexedDB outbox and server-side idempotent sync API.
 */
const VERSION = 'jdv-shell-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    try { await cache.add(new Request(OFFLINE_URL, { cache: 'reload' })); } catch (_) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('jdv-shell-') && key !== VERSION).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Immutable Next.js build assets can be cached; API responses never are.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (_) {
        return cached || Response.error();
      }
    })());
    return;
  }

  // Never cache authenticated pages or HTML. If navigation fails, show the offline guide.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch (_) {
        const cache = await caches.open(VERSION);
        return (await cache.match(OFFLINE_URL)) || new Response(
          '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JDV CRM hors ligne</title><body><h1>Connexion indisponible</h1><p>Reconnectez-vous pour continuer. Aucune opération métier n’a été synchronisée.</p></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
  }
});
