'use client';

import { useMemo, useState } from 'react';
import { formatUAH, formatUahCompact } from '@/lib/money';
import { Card, CardHeader, EmptyState, PageHeader, Stat, Spinner } from '@/components/ui';
import { DateRangePicker } from '@/components/datepicker';
import { BarList, ColumnChart, Donut, chartPalette, type Column } from '@/components/charts';
import { IconAlert, IconBouquet, IconCoins, IconTrendUp, IconWallet } from '@/components/icons';
import { todayKyiv } from '@/lib/date';
import { useDashboardData } from '@/lib/hooks/use-dashboard-data';

const MONTHS_SHORT = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];

type RangeKey = 'this-month' | 'last-month' | 'year' | 'all';

function presetRange(key: RangeKey): { from: string; to: string } {
  const today = todayKyiv();
  const [y, m] = today.split('-').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = (yy: number, mm: number) => new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  switch (key) {
    case 'this-month':
      return { from: `${y}-${pad(m)}-01`, to: today };
    case 'last-month': {
      const ly = m === 1 ? y - 1 : y;
      const lm = m === 1 ? 12 : m - 1;
      return { from: `${ly}-${pad(lm)}-01`, to: `${ly}-${pad(lm)}-${pad(lastDay(ly, lm))}` };
    }
    case 'year':
      return { from: `${y}-01-01`, to: today };
    case 'all':
      return { from: '2000-01-01', to: today };
  }
}

const PRESETS = [
  { label: 'Цей місяць', range: () => presetRange('this-month') },
  { label: 'Минулий місяць', range: () => presetRange('last-month') },
  { label: 'Цей рік', range: () => presetRange('year') },
  { label: 'Весь час', range: () => presetRange('all') },
];

export default function DashboardPage() {
  const initial = presetRange('this-month');
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const { summary, monthly, top, outstanding, loading } = useDashboardData(from, to);

  const columns = useMemo<Column[]>(
    () =>
      monthly.map((r) => {
        const mm = Number(r.month.slice(5, 7));
        return { label: MONTHS_SHORT[mm - 1] ?? r.month, a: r.grossRevenueKopiyky, b: r.netProfitKopiyky };
      }),
    [monthly],
  );

  const donutSegments = useMemo(() => {
    if (!summary) return [];
    // Packaging add-ons are income (inside «Чистий дохід»), not a cost segment.
    return [
      { label: 'Собівартість квітів', value: summary.flowersCostKopiyky, color: chartPalette.clay },
      { label: 'Загальні витрати', value: summary.generalExpensesKopiyky, color: chartPalette.inkFaint },
      { label: 'Чистий дохід', value: Math.max(0, summary.netProfitKopiyky), color: chartPalette.sage },
    ];
  }, [summary]);

  if (loading || !summary) return <Spinner label="Рахуємо дохід…" />;

  return (
    <div className="space-y-7">
      <PageHeader
        title="Дашборд"
        subtitle="Прибутковість студії за обраний період"
        actions={
          <DateRangePicker
            from={from}
            to={to}
            onChange={(f, t) => {
              setFrom(f);
              setTo(t);
            }}
            presets={PRESETS}
            className="w-full sm:w-72"
          />
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Брудний дохід"
          value={formatUAH(summary.grossRevenueKopiyky)}
          sub="виручка за період"
          tone="bloom"
          icon={<IconCoins width={18} height={18} />}
        />
        <Stat
          label="Чистий дохід"
          value={formatUAH(summary.netProfitKopiyky)}
          sub="після всіх витрат"
          tone="sage"
          icon={<IconTrendUp width={18} height={18} />}
        />
        <Stat
          label="Готівка отримана"
          value={formatUAH(summary.cashReceivedKopiyky)}
          sub="фактично на руках"
          icon={<IconWallet width={18} height={18} />}
        />
        <Stat
          label="Продано букетів"
          value={String(summary.soldCount)}
          sub="за період"
          icon={<IconBouquet width={18} height={18} />}
        />
      </div>

      {/* Chart + breakdown */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Дохід за місяцями" />
          <div className="p-5">
            {columns.length > 0 ? (
              <ColumnChart columns={columns} aLabel="Брудний" bLabel="Чистий" format={formatUAH} height={230} />
            ) : (
              <EmptyState title="Ще немає продажів цього року" description="Дані з’являться після першого проданого букета." />
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Куди йде дохід" />
          <div className="p-5">
            {summary.grossRevenueKopiyky > 0 ? (
              <Donut
                segments={donutSegments}
                centerValue={formatUahCompact(summary.grossRevenueKopiyky)}
                centerLabel="Немає даних"
                format={formatUAH}
              />
            ) : (
              <EmptyState title="Немає виручки за період" description="Оберіть інший період або продайте букет." />
            )}
          </div>
        </Card>
      </div>

      {/* Top flowers + debts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Найприбутковіші квіти" right={<span className="text-xs text-ink-faint">за наваром</span>} />
          <div className="p-5">
            {top.length > 0 ? (
              <BarList
                items={top.map((f) => ({
                  label: f.name,
                  value: f.totalMarginKopiyky,
                  caption: `${f.totalQuantity} · ${f.timesUsed}× у букетах`,
                }))}
                format={formatUAH}
              />
            ) : (
              <EmptyState title="Немає даних за період" />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Неоплачені букети"
            right={
              outstanding && outstanding.count > 0 ? (
                <span className="nums text-xs font-medium text-clay-ink">
                  борг {formatUAH(outstanding.outstandingKopiyky)}
                </span>
              ) : undefined
            }
          />
          <div className="p-2">
            {outstanding && outstanding.count > 0 ? (
              <ul className="divide-y divide-line">
                {outstanding.bouquets.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-clay-tint text-clay">
                        <IconAlert width={16} height={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-ink">{b.title || 'Без назви'}</span>
                        <span className="block text-xs text-ink-faint">{b.soldOn ?? '—'}</span>
                      </span>
                    </span>
                    <span className="nums shrink-0 text-sm font-semibold text-clay-ink">
                      {formatUAH(b.owedKopiyky)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Усі букети оплачені" description="Жодного боргу — чудова робота." className="py-10" />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
