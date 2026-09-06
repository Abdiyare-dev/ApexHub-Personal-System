"use client";

import { useEffect } from "react";

/**
 * Registers public/sw.js. Nothing else registers it — @serwist/next used to do
 * this automatically, but it is webpack-only and this app builds with Turbopack.
 *
 * Dev is skipped on purpose: a live service worker caches build output that
 * Turbopack is rewriting on every save, which produces stale-asset confusion.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    };

    // Registering during load contends with the app's own first paint and data
    // fetches, so wait until the page is idle.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
