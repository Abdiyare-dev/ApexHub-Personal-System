/*
 * ApexHub service worker (hand-written).
 *
 * This file is SOURCE, not a build artifact — Next 16 builds with Turbopack and
 * @serwist/next is webpack-only, so there is no plugin generating this. Edit it
 * directly. Bump CACHE_VERSION whenever the caching rules below change.
 */

const CACHE_VERSION = "v2";
const SHELL_CACHE = `apexhub-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `apexhub-assets-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

// Essential shell assets cached during install
const SHELL_ASSETS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll is all-or-nothing; add each separately so one 404 doesn't abort install.
      .then((cache) => Promise.allSettled(SHELL_ASSETS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("apexhub-") && key !== SHELL_CACHE && key !== ASSET_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// Network-first: the app is data-heavy and every page is user-specific, so a
// stale shell is worse than a short wait. Cache is the offline fallback only.
async function networkFirstNavigation(event) {
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) return preloaded;
    return await fetch(event.request);
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    return (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

// Cache-first for immutable build output (/_next/static/* is content-hashed).
async function cacheFirstAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only GET is cacheable, and cross-origin/API traffic must always hit the
  // network so Supabase auth and mutations are never served stale.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(event));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/icon.png") {
    event.respondWith(cacheFirstAsset(request));
  }
});
