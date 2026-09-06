import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

// A stray pnpm-lock.yaml sits in C:\Users\Abdiq, so Next infers the home
// directory as the workspace root. Pin it to this project instead.
const projectRoot = dirname(fileURLToPath(import.meta.url))

// PWA note: this project used to wrap the config in `@serwist/next`, which is a
// webpack plugin. Next 16 builds with Turbopack by default, and merely defining
// a `webpack()` hook forces the legacy webpack path — which currently fails on
// this app ("Invariant: Expected workStore to be initialized"). @serwist/next
// also warns outright that it does not support Turbopack. The service worker is
// therefore hand-written at public/sw.js and registered by ServiceWorkerRegistrar,
// which keeps the build on Turbopack and the PWA fully functional.

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: projectRoot,
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
