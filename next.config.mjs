import withSerwistInit from "@serwist/next"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

const isDev = process.env.NODE_ENV === "development"

// A stray pnpm-lock.yaml sits in C:\Users\Abdiq, so Next infers the home
// directory as the workspace root. Pin it to this project instead.
const projectRoot = dirname(fileURLToPath(import.meta.url))

const withSerwist = withSerwistInit({
  swSrc: "src/sw.js",
  swDest: "public/sw.js",
  disable: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: projectRoot,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

// Serwist injects a webpack config, which Turbopack warns about in dev.
// The service worker is disabled anyway, so skip the wrapper while developing.
export default isDev ? nextConfig : withSerwist(nextConfig)
