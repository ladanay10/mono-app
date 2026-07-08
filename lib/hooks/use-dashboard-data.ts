'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { MonthlyRow, Outstanding, ReportSummary, TopFlower } from '@/lib/types';

/** Loads all dashboard reports for the given date range. */
export function useDashboardData(from: string, to: string) {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [top, setTop] = useState<TopFlower[]>([]);
  const [outstanding, setOutstanding] = useState<Outstanding | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [s, m, t, o] = await Promise.all([
      api<ReportSummary>(`/reports/summary?from=${from}&to=${to}`),
      api<MonthlyRow[]>('/reports/monthly'),
      api<TopFlower[]>(`/reports/top-flowers?from=${from}&to=${to}&limit=8`),
      api<Outstanding>('/reports/outstanding'),
    ]);
    setSummary(s);
    setMonthly(m);
    setTop(t);
    setOutstanding(o);
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { summary, monthly, top, outstanding, loading, reload };
}
