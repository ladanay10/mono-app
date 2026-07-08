'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatUAH } from '@/lib/money';
import { BOUQUET_STATUSES, type BouquetListItem, type BouquetStatus } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/labels';
import { Button, Card, EmptyState, IconButton, Input, PageHeader, Spinner, StatusBadge } from '@/components/ui';
import { Select, type SelectOption } from '@/components/select';
import { IconBouquet, IconChevronLeft, IconPlus, IconSearch } from '@/components/icons';

type FilterStatus = BouquetStatus | 'ALL';

const STATUS_FILTER: SelectOption<FilterStatus>[] = [
  { value: 'ALL', label: 'Усі статуси' },
  ...BOUQUET_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
];

export default function BouquetsPage() {
  const [items, setItems] = useState<BouquetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<FilterStatus>('ALL');
  const router = useRouter();

  useEffect(() => {
    api<BouquetListItem[]>('/bouquets')
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((b) => {
      if (status !== 'ALL' && b.status !== status) return false;
      if (q && !(b.title || 'без назви').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, query, status]);

  async function createBouquet() {
    setCreating(true);
    try {
      const b = await api<{ id: string }>('/bouquets', { method: 'POST', body: {} });
      router.push(`/bouquets/${b.id}`);
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <Spinner label="Завантажуємо букети…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Букети"
        subtitle="Кожен букет — окрема одиниця доходу з живим підрахунком прибутку"
        actions={
          <Button onClick={createBouquet} disabled={creating}>
            <IconPlus width={18} height={18} /> {creating ? 'Створюємо…' : 'Новий букет'}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <IconSearch width={18} height={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Пошук за назвою…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11"
          />
        </div>
        <Select value={status} onChange={setStatus} options={STATUS_FILTER} ariaLabel="Статус" className="w-48" />
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<IconBouquet width={26} height={26} />}
            title={items.length === 0 ? 'Ще немає букетів' : 'Нічого не знайдено'}
            description={
              items.length === 0
                ? 'Створіть перший букет — додайте квіти з каталогу і одразу побачите прибуток.'
                : 'Спробуйте змінити пошук або фільтр статусу.'
            }
            action={
              items.length === 0 ? (
                <Button onClick={createBouquet} disabled={creating}>
                  <IconPlus width={18} height={18} /> Новий букет
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Mobile: tappable cards (no horizontal scroll) */}
            <ul className="divide-y divide-line lg:hidden">
              {filtered.map((b) => {
                const gross = b.profit?.revenueKopiyky ?? 0;
                const net = b.profit?.netProfitKopiyky ?? 0;
                const pct = gross > 0 ? Math.max(0, Math.min(100, (net / gross) * 100)) : 0;
                return (
                  <li key={b.id}>
                    <Link
                      href={`/bouquets/${b.id}`}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-surface-soft"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-ink">{b.title || 'Без назви'}</div>
                        <div className="mt-1.5">
                          <StatusBadge status={b.status} />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="nums font-semibold text-sage-ink">{formatUAH(net)}</div>
                        <div className="mt-1.5 flex items-center justify-end gap-1.5">
                          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-sunk">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: 'var(--color-sage)' }}
                            />
                          </div>
                          <span className="nums text-xs text-ink-faint">{Math.round(pct)}%</span>
                        </div>
                      </div>
                      <IconChevronLeft width={18} height={18} className="shrink-0 rotate-180 text-ink-faint" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Desktop: full table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3">Назва</th>
                  <th className="px-5 py-3">Статус</th>
                  <th className="px-5 py-3">Маржа</th>
                  <th className="px-5 py-3 text-right">Брудний дохід</th>
                  <th className="px-5 py-3 text-right">Чистий дохід</th>
                  <th className="px-5 py-3 text-right">Продано</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((b) => {
                  const gross = b.profit?.revenueKopiyky ?? 0;
                  const net = b.profit?.netProfitKopiyky ?? 0;
                  const pct = gross > 0 ? Math.max(0, Math.min(100, (net / gross) * 100)) : 0;
                  return (
                    <tr
                      key={b.id}
                      className="group cursor-pointer transition-colors hover:bg-surface-soft"
                      onClick={() => router.push(`/bouquets/${b.id}`)}
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/bouquets/${b.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-ink hover:text-bloom-ink"
                        >
                          {b.title || 'Без назви'}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-sunk">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: 'var(--color-sage)' }}
                            />
                          </div>
                          <span className="nums text-xs text-ink-faint">{Math.round(pct)}%</span>
                        </div>
                      </td>
                      <td className="nums px-5 py-3 text-right text-ink-soft">{formatUAH(gross)}</td>
                      <td className="nums px-5 py-3 text-right font-semibold text-sage-ink">{formatUAH(net)}</td>
                      <td className="px-5 py-3 text-right text-xs text-ink-faint">{b.soldOn ?? '—'}</td>
                      <td className="px-5 py-3 text-right">
                        <IconButton label="Відкрити" tone="bloom" className="rotate-180">
                          <IconChevronLeft width={18} height={18} />
                        </IconButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
