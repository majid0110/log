// Dayline service worker: keeps the app itself on the phone so it opens without internet.
// Only this site's own files are handled. Database requests (Supabase) are never touched.

const CACHE = 'dayline-app-v1'

// Saves the page and every file it links to (scripts, styles, icons).
async function cacheApp() {
  const cache = await caches.open(CACHE)
  const res = await fetch('./', { cache: 'no-store' })
  if (!res.ok) return
  const html = await res.clone().text()
  await cache.put('./', res)
  const files = new Set(['./manifest.webmanifest', './favicon.svg', './icon-180.png', './icon-192.png', './icon-512.png'])
  for (const m of html.matchAll(/(?:src|href)="(\.?\/?assets\/[^"]+)"/g)) files.add(m[1].startsWith('.') ? m[1] : `./${m[1].replace(/^\//, '')}`)
  await Promise.all([...files].map((f) => cache.add(f).catch(() => undefined)))

  // Remove old versions' files that the new page no longer uses.
  const wanted = new Set([...files].map((f) => new URL(f, self.registration.scope).href))
  for (const req of await cache.keys()) {
    if (req.url.includes('/assets/') && !wanted.has(req.url)) await cache.delete(req)
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheApp().catch(() => undefined).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // The page: try the internet first (to get updates), fall back to the saved copy offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) event.waitUntil(cacheApp().catch(() => undefined))
          return res
        })
        .catch(async () => (await caches.match('./')) || Response.error()),
    )
    return
  }

  // Files: use the saved copy if there is one, otherwise download and save it.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        }),
    ),
  )
})
