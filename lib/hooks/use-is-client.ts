'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * True on the client, false during SSR — without a setState-in-effect.
 * Use to gate client-only rendering (e.g. portals) in a hydration-safe way.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
