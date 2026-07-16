"use client";

import { useMemo, useState } from "react";
import type { Tone } from "@/lib/labels";
import { formatUAH, formatUahCompact } from "@/lib/money";
import {
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Spinner,
} from "@/components/ui";
import { DateRangePicker } from "@/components/datepicker";
import {
  ColumnChart,
  Donut,
  chartPalette,
  type Column,
} from "@/components/charts";
import {
  IconBouquet,
  IconCoins,
  IconTrendUp,
  IconWallet,
} from "@/components/icons";
import { todayKyiv } from "@/lib/date";
import { useDashboardData } from "@/lib/hooks/use-dashboard-data";

const MONTHS_SHORT = [
  "січ",
  "лют",
  "бер",
  "кві",
  "тра",
  "чер",
  "лип",
  "сер",
  "вер",
  "жов",
  "лис",
  "гру",
];

const shortMonth = (isoMonth: string) =>
  MONTHS_SHORT[Number(isoMonth.slice(5, 7)) - 1] ?? isoMonth;

type RangeKey = "this-month" | "last-month" | "year" | "all";

function presetRange(key: RangeKey): { from: string; to: string } {
  const today = todayKyiv();
  const [y, m] = today.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = (yy: number, mm: number) =>
    new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  switch (key) {
    case "this-month":
      return { from: `${y}-${pad(m)}-01`, to: today };
    case "last-month": {
      const ly = m === 1 ? y - 1 : y;
      const lm = m === 1 ? 12 : m - 1;
      return {
        from: `${ly}-${pad(lm)}-01`,
        to: `${ly}-${pad(lm)}-${pad(lastDay(ly, lm))}`,
      };
    }
    case "year":
      return { from: `${y}-01-01`, to: today };
    case "all":
      return { from: "2000-01-01", to: today };
  }
}

const PRESETS = [
  { label: "Цей місяць", range: () => presetRange("this-month") },
  { label: "Минулий місяць", range: () => presetRange("last-month") },
  { label: "Цей рік", range: () => presetRange("year") },
  { label: "Весь час", range: () => presetRange("all") },
];

/* ---- KPI tile ------------------------------------------------------ */
const VALUE_COLOR: Record<Tone, string> = {
  ink: "text-ink",
  bloom: "text-bloom-ink",
  sage: "text-sage-ink",
  clay: "text-clay-ink",
  gold: "text-gold-ink",
};
const ICON_WRAP: Record<Tone, string> = {
  ink: "bg-ink/[0.06] text-ink-soft",
  bloom: "bg-bloom-tint text-bloom",
  sage: "bg-sage-tint text-sage",
  clay: "bg-clay-tint text-clay",
  gold: "bg-gold-tint text-gold",
};

function Kpi({
  label,
  value,
  sub,
  icon,
  tone = "ink",
  delta,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  delta?: number | null;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[13px] font-medium text-ink-soft">{label}</div>
        {icon && (
          <span
            className={`grid h-9 w-9 place-items-center rounded-xl ${ICON_WRAP[tone]}`}
          >
            {icon}
          </span>
        )}
      </div>
      <div
        className={`nums mt-3 text-[26px] font-semibold leading-none ${VALUE_COLOR[tone]}`}
      >
        {value}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        {delta != null && (
          <span
            className={`nums inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
              delta >= 0
                ? "bg-sage-tint text-sage-ink"
                : "bg-clay-tint text-clay-ink"
            }`}
          >
            {delta >= 0 ? "↑" : "↓"} {Math.abs(Math.round(delta))}%
          </span>
        )}
        {sub && <div className="text-xs text-ink-faint">{sub}</div>}
      </div>
    </Card>
  );
}

/* ---- Unit economics: margin ring + per-bouquet stats -------------- */
function StatRow({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: string;
  tone?: "ink" | "sage";
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
      <span className="text-sm text-ink-soft">{label}</span>
      <span
        className={`nums text-sm font-semibold ${tone === "sage" ? "text-sage-ink" : "text-ink"}`}
      >
        {value}
      </span>
    </div>
  );
}

function MarginPanel({
  marginPct,
  avgCheck,
  costPerBouquet,
  profitPerBouquet,
}: {
  marginPct: number;
  avgCheck: number;
  costPerBouquet: number;
  profitPerBouquet: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(marginPct)));
  return (
    <div className="flex flex-col items-center gap-7 p-5 sm:flex-row sm:gap-8">
      <div className="relative h-40 w-40 shrink-0">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(var(--color-sage) ${pct * 3.6}deg, var(--color-surface-sunk) 0deg)`,
          }}
        />
        <div className="absolute inset-3 rounded-full bg-surface" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="nums text-[38px] font-semibold leading-none text-ink">
            {pct}%
          </span>
          <span className="mt-1.5 text-xs text-ink-faint">чиста маржа</span>
        </div>
      </div>
      <div className="w-full flex-1">
        <StatRow label="Середній чек" value={formatUAH(avgCheck)} />
        <StatRow
          label="Собівартість / букет"
          value={formatUAH(costPerBouquet)}
        />
        <StatRow
          label="Навар / букет"
          value={formatUAH(profitPerBouquet)}
          tone="sage"
        />
      </div>
    </div>
  );
}

/* ---- Top flowers — ranked bars ------------------------------------ */
function TopFlowers({
  items,
}: {
  items: { label: string; value: number; caption: string }[];
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3.5 p-5">
      {items.map((f, i) => (
        <li key={i} className="flex items-center gap-3">
          <span className="nums w-4 shrink-0 text-right text-xs font-semibold text-ink-faint">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium text-ink">
                {f.label}
              </span>
              <span className="nums shrink-0 text-sm font-semibold text-sage-ink">
                {formatUAH(f.value)}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-sunk">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(4, (f.value / max) * 100)}%`,
                  background:
                    "linear-gradient(90deg, var(--color-sage), #a7f3d0)",
                }}
              />
            </div>
            <div className="mt-1 text-[11px] text-ink-faint">{f.caption}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage() {
  const initial = presetRange("this-month");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const { summary, monthly, top, loading } = useDashboardData(from, to);

  const columns = useMemo<Column[]>(
    () =>
      monthly.map((r) => ({
        label: shortMonth(r.month),
        a: r.grossRevenueKopiyky,
        b: r.netProfitKopiyky,
      })),
    [monthly],
  );

  // Month-over-month momentum on net profit (last two recorded months).
  const momentum = useMemo<number | null>(() => {
    if (monthly.length < 2) return null;
    const cur = monthly[monthly.length - 1].netProfitKopiyky;
    const prev = monthly[monthly.length - 2].netProfitKopiyky;
    if (prev === 0) return null;
    return ((cur - prev) / Math.abs(prev)) * 100;
  }, [monthly]);

  const donutSegments = useMemo(() => {
    if (!summary) return [];
    // Packaging add-ons are income (inside «Чистий дохід»), not a cost segment.
    return [
      {
        label: "Собівартість квітів",
        value: summary.flowersCostKopiyky,
        color: chartPalette.clay,
      },
      {
        label: "Загальні витрати",
        value: summary.generalExpensesKopiyky,
        color: chartPalette.gold,
      },
      {
        label: "Чистий дохід",
        value: Math.max(0, summary.netProfitKopiyky),
        color: chartPalette.sage,
      },
    ];
  }, [summary]);

  if (loading || !summary) return <Spinner label="Рахуємо дохід…" />;

  const marginPct =
    summary.grossRevenueKopiyky > 0
      ? (summary.netProfitKopiyky / summary.grossRevenueKopiyky) * 100
      : 0;
  const avgCheck =
    summary.soldCount > 0 ? summary.grossRevenueKopiyky / summary.soldCount : 0;
  const avgProfit =
    summary.soldCount > 0 ? summary.netProfitKopiyky / summary.soldCount : 0;
  const costPerBouquet =
    summary.soldCount > 0 ? summary.flowersCostKopiyky / summary.soldCount : 0;
  const owed = Math.max(
    0,
    summary.grossRevenueKopiyky - summary.cashReceivedKopiyky,
  );

  return (
    <div className="space-y-6">
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
        <Kpi
          label="Чистий дохід"
          value={formatUAH(summary.netProfitKopiyky)}
          tone="sage"
          icon={<IconTrendUp width={18} height={18} />}
          delta={momentum}
          sub={`маржа ${Math.round(marginPct)}%`}
        />
        <Kpi
          label="Брудний дохід"
          value={formatUAH(summary.grossRevenueKopiyky)}
          tone="bloom"
          icon={<IconCoins width={18} height={18} />}
          sub={`сер. чек ${formatUahCompact(avgCheck)}`}
        />
        <Kpi
          label="Готівка отримана"
          value={formatUAH(summary.cashReceivedKopiyky)}
          icon={<IconWallet width={18} height={18} />}
          sub={
            owed > 0 ? `борг ${formatUahCompact(owed)}` : "оплачено повністю"
          }
        />
        <Kpi
          label="Продано букетів"
          value={String(summary.soldCount)}
          icon={<IconBouquet width={18} height={18} />}
          sub={`сер. навар ${formatUahCompact(avgProfit)}`}
        />
      </div>

      {/* Revenue + structure */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Дохід і прибуток по місяцях"
            right={<span className="text-xs text-ink-faint">₴ за місяць</span>}
          />
          <div className="p-5">
            {columns.length > 0 ? (
              <ColumnChart
                columns={columns}
                aLabel="Брудний"
                bLabel="Чистий"
                format={formatUAH}
                height={250}
              />
            ) : (
              <EmptyState
                title="Ще немає продажів"
                description="Дані зʼявляться після першого проданого букета."
              />
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Структура доходу" />
          <div className="p-5">
            {summary.grossRevenueKopiyky > 0 ? (
              <Donut
                segments={donutSegments}
                centerValue={formatUahCompact(summary.grossRevenueKopiyky)}
                centerLabel="Немає даних"
                format={formatUAH}
              />
            ) : (
              <EmptyState
                title="Немає виручки за період"
                description="Оберіть інший період або продайте букет."
              />
            )}
          </div>
        </Card>
      </div>

      {/* Unit economics + top flowers */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Юніт-економіка"
            right={<span className="text-xs text-ink-faint">на 1 букет</span>}
          />
          {summary.soldCount > 0 ? (
            <MarginPanel
              marginPct={marginPct}
              avgCheck={avgCheck}
              costPerBouquet={costPerBouquet}
              profitPerBouquet={avgProfit}
            />
          ) : (
            <div className="p-5">
              <EmptyState
                title="Ще немає проданих букетів"
                description="Показники зʼявляться після першого продажу."
              />
            </div>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Топ квіти за наваром"
            right={<span className="text-xs text-ink-faint">за період</span>}
          />
          {top.length > 0 ? (
            <TopFlowers
              items={top.map((f) => ({
                label: f.name,
                value: f.totalMarginKopiyky,
                caption: `${f.totalQuantity} шт · ${f.timesUsed}× у букетах`,
              }))}
            />
          ) : (
            <div className="p-5">
              <EmptyState title="Немає даних за період" />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
