"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount. Silently no-ops in dev mode
 * if unsupported, and never throws — a failed SW registration must not
 * break the app.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch((err) => {
        console.error("Service worker registration failed", err);
      });
  }, []);

  return null;
}
