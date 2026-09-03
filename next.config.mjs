import withSerwistInit from "@serwist/next"

const isDev = process.env.NODE_ENV === "development"

const withSerwist = withSerwistInit({
  swSrc: "src/sw.js",
  swDest: "public/sw.js",
  disable: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
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
