'use client';

import { useEffect } from 'react';

// Registers the service worker so the app is installable and works offline.
export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* ignore registration failures (e.g. unsupported / http) */
      });
    }
  }, []);
  return null;
}
