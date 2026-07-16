"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MonthlyRow, ReportSummary, TopFlower } from "@/lib/types";

/** Loads all dashboard reports for the given date range. */
export function useDashboardData(from: string, to: string) {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [top, setTop] = useState<TopFlower[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [s, m, t] = await Promise.all([
      api<ReportSummary>(`/reports/summary?from=${from}&to=${to}`),
      api<MonthlyRow[]>("/reports/monthly"),
      api<TopFlower[]>(`/reports/top-flowers?from=${from}&to=${to}&limit=8`),
    ]);
    setSummary(s);
    setMonthly(m);
    setTop(t);
    setLoading(false);
  }, [from, to]);

  // Reload whenever the range changes. State is set inside .then (async), not
  // synchronously in the effect body.
  useEffect(() => {
    let active = true;
    Promise.all([
      api<ReportSummary>(`/reports/summary?from=${from}&to=${to}`),
      api<MonthlyRow[]>("/reports/monthly"),
      api<TopFlower[]>(`/reports/top-flowers?from=${from}&to=${to}&limit=8`),
    ])
      .then(([s, m, t]) => {
        if (!active) return;
        setSummary(s);
        setMonthly(m);
        setTop(t);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [from, to]);

  return { summary, monthly, top, loading, reload };
}
