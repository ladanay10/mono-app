'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast';
import type { BouquetDetail, CatalogItem, Expense } from '@/lib/types';

/**
 * All data + mutation plumbing for the bouquet detail page, kept out of the view.
 * `run` executes a mutation, reloads, and toasts success/failure.
 */
export function useBouquetDetail(id: string) {
  const toast = useToast();
  const [detail, setDetail] = useState<BouquetDetail | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [d, exp] = await Promise.all([
      api<BouquetDetail>(`/bouquets/${id}`),
      api<Expense[]>(`/expenses?bouquetId=${id}`),
    ]);
    setDetail(d);
    setExpenses(exp);
  }, [id]);

  useEffect(() => {
    Promise.all([reload(), api<CatalogItem[]>('/catalog').then(setCatalog)]).finally(() =>
      setLoading(false),
    );
  }, [reload]);

  const run = useCallback(
    async (fn: () => Promise<unknown>, okMsg?: string) => {
      try {
        await fn();
        await reload();
        if (okMsg) toast.success(okMsg);
      } catch (err) {
        toast.error('Не вдалося', err instanceof Error ? err.message : 'Спробуйте ще раз');
      }
    },
    [reload, toast],
  );

  return { detail, catalog, expenses, loading, reload, run };
}
