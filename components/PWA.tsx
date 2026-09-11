"use client";

import { useEffect } from "react";

/** Registers the service worker so the app can be installed to a phone home screen. */
export default function PWA() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
