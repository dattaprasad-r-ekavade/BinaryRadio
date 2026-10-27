const CACHE_VERSION = new URL(self.location.href).searchParams.get('cache') || 'synthreel-dev'
const CACHE_NAME = CACHE_VERSION
const APP_BASE = new URL('./', self.location.href)
const appUrl = (path) => new URL(path, APP_BASE).href
const OFFLINE_URL = appUrl('index.html')
const CORE_ASSETS = [
  appUrl('./'),
  OFFLINE_URL,
  appUrl('manifest.webmanifest'),
  appUrl('tunes/manifest.json'),
  'https://unpkg.com/@strudel/web@1.3.0',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.allSettled(CORE_ASSETS.map((asset) => cache.add(asset)))),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

const TUNES_PREFIX = appUrl('tunes/')

/* Pages and tunes change without their URL changing, so cache-first served
   stale copies forever: an old index.html kept registering the old worker, and
   edited tunes or manifest entries never reached the player. Fetch those from
   the network first and fall back to the cache only when offline. */
function isNetworkFirst(request) {
  return request.mode === 'navigate' || request.url.startsWith(TUNES_PREFIX)
}

async function networkFirst(request) {
  try {
    const res = await fetch(request)
    if (res.ok) {
      const copy = res.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {})
    }
    return res
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (request.mode === 'navigate') {
      return (await caches.match(OFFLINE_URL)) || Response.error()
    }
    return Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  if (isNetworkFirst(request)) {
    event.respondWith(networkFirst(request))
    return
  }

  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) return cached
      try {
        const res = await fetch(request)
        if (!res) return res
        const url = new URL(request.url)
        const cacheable = res.ok || res.type === 'opaque'
        if (
          cacheable &&
          (url.origin === self.location.origin || url.href.includes('@strudel/web'))
        ) {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {})
        }
        return res
      } catch {
        if (request.mode === 'navigate') {
          return (await caches.match(OFFLINE_URL)) || Response.error()
        }
        return Response.error()
      }
    }),
  )
})
