"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast";
import type { BouquetDetail, CatalogItem, Expense } from "@/lib/types";

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

  // Initial load. State is set inside .then (async), not synchronously in the
  // effect body. `reload` handles refetch after mutations.
  useEffect(() => {
    let active = true;
    Promise.all([
      api<BouquetDetail>(`/bouquets/${id}`),
      api<Expense[]>(`/expenses?bouquetId=${id}`),
      api<CatalogItem[]>("/catalog"),
    ])
      .then(([d, exp, cat]) => {
        if (!active) return;
        setDetail(d);
        setExpenses(exp);
        setCatalog(cat);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const run = useCallback(
    // `reload: false` for actions that navigate away or delete this bouquet —
    // otherwise reload() would refetch a gone resource and pop a false error.
    async (
      fn: () => Promise<unknown>,
      okMsg?: string,
      opts?: { reload?: boolean },
    ) => {
      const shouldReload = opts?.reload !== false;
      try {
        await fn();
        if (shouldReload) await reload();
        if (okMsg) toast.success(okMsg);
      } catch (err) {
        // Resync to the real server state so a stale button (e.g. a status that
        // changed under us) disappears instead of erroring again.
        if (shouldReload) {
          try {
            await reload();
          } catch {
            /* the bouquet may be gone — ignore */
          }
        }
        toast.error(
          "Не вдалося",
          err instanceof Error ? err.message : "Спробуйте ще раз",
        );
      }
    },
    [reload, toast],
  );

  return { detail, catalog, expenses, loading, reload, run };
}
