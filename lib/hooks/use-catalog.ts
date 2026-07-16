'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { CatalogItem } from '@/lib/types';

/** Loads the catalog list; `reload` refetches after a mutation. */
export function useCatalog() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setItems(await api<CatalogItem[]>('/catalog'));
    setLoading(false);
  }, []);

  // Initial load. State is set inside .then (async), never synchronously in the
  // effect body — that is what the set-state-in-effect rule guards against.
  useEffect(() => {
    let active = true;
    api<CatalogItem[]>('/catalog')
      .then((rows) => {
        if (active) setItems(rows);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { items, loading, reload };
}
