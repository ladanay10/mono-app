'use client';

import { useMemo } from 'react';
import type { EChartsCoreOption } from 'echarts/core';
import { EChart } from '@/components/echart';
import { formatUahCompact } from '@/lib/money';

/* Brand palette in hex (canvas can't resolve CSS vars). Mirrors globals.css. */
export const chartPalette = {
  bloom: '#b0475f',
  bloomInk: '#8a3247',
  sage: '#4b7d5b',
  sageInk: '#3a6549',
  clay: '#b8452f',
  gold: '#a9761f',
  ink: '#241d1a',
  inkSoft: '#6f635b',
  inkFaint: '#a3968d',
  line: '#ece2db',
  sunk: '#f1e9e3',
  surface: '#ffffff',
};

const FONT = 'Inter, ui-sans-serif, system-ui, sans-serif';

const tooltipBase = {
  backgroundColor: chartPalette.surface,
  borderColor: chartPalette.line,
  borderWidth: 1,
  padding: [8, 12] as [number, number],
  textStyle: { color: chartPalette.ink, fontFamily: FONT, fontSize: 12 },
  extraCssText: 'border-radius:12px;box-shadow:0 8px 20px -6px rgba(60,40,34,0.18);',
};

/* echarts callback params, read loosely to sidestep union types */
interface TP {
  name?: string;
  axisValue?: string;
  marker?: string;
  seriesName?: string;
  value?: number;
  percent?: number;
}
const toList = (raw: unknown): TP[] => (Array.isArray(raw) ? (raw as TP[]) : [raw as TP]);

/* ------------------------------------------------------------------ *
 * Grouped column chart (two series)
 * ------------------------------------------------------------------ */
export type Column = { label: string; a: number; b: number };

export function ColumnChart({
  columns,
  aLabel,
  bLabel,
  format,
  height = 220,
}: {
  columns: Column[];
  aLabel: string;
  bLabel: string;
  format: (v: number) => string;
  height?: number;
}) {
  const option = useMemo<EChartsCoreOption>(
    () => ({
      grid: { left: 6, right: 10, top: 34, bottom: 2, containLabel: true },
      legend: {
        top: 0,
        right: 0,
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 16,
        textStyle: { color: chartPalette.inkSoft, fontFamily: FONT, fontSize: 12 },
        data: [aLabel, bLabel],
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(176,71,95,0.06)' } },
        ...tooltipBase,
        formatter: (raw: unknown) => {
          const list = toList(raw);
          const head = `<div style="font-weight:600;margin-bottom:4px">${list[0]?.axisValue ?? ''}</div>`;
          const rows = list
            .map(
              (p) =>
                `<div style="display:flex;justify-content:space-between;gap:20px;line-height:1.6"><span>${p.marker ?? ''}${p.seriesName ?? ''}</span><b>${format(Number(p.value ?? 0))}</b></div>`,
            )
            .join('');
          return head + rows;
        },
      },
      xAxis: {
        type: 'category',
        data: columns.map((c) => c.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: chartPalette.line } },
        axisLabel: { color: chartPalette.inkFaint, fontFamily: FONT, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: chartPalette.line, type: 'dashed' } },
        axisLabel: {
          color: chartPalette.inkFaint,
          fontFamily: FONT,
          fontSize: 11,
          formatter: (v: number) => formatUahCompact(v),
        },
      },
      series: [
        {
          name: aLabel,
          type: 'bar',
          data: columns.map((c) => c.a),
          barMaxWidth: 16,
          barGap: '25%',
          itemStyle: { color: chartPalette.bloom, borderRadius: [4, 4, 0, 0] },
        },
        {
          name: bLabel,
          type: 'bar',
          data: columns.map((c) => c.b),
          barMaxWidth: 16,
          itemStyle: { color: chartPalette.sage, borderRadius: [4, 4, 0, 0] },
        },
      ],
    }),
    [columns, aLabel, bLabel, format],
  );

  return <EChart option={option} height={height} />;
}

/* ------------------------------------------------------------------ *
 * Horizontal bar list (ranked)
 * ------------------------------------------------------------------ */
export function BarList({
  items,
  format,
}: {
  items: { label: string; value: number; caption?: string }[];
  format: (v: number) => string;
}) {
  const height = Math.max(120, items.length * 38 + 8);

  const option = useMemo<EChartsCoreOption>(
    () => ({
      grid: { left: 4, right: 84, top: 4, bottom: 2, containLabel: true },
      tooltip: {
        trigger: 'item',
        ...tooltipBase,
        formatter: (raw: unknown) => {
          const p = toList(raw)[0];
          return `<div style="font-weight:600;margin-bottom:2px">${p?.name ?? ''}</div><div>${format(Number(p?.value ?? 0))}</div>`;
        },
      },
      xAxis: { type: 'value', show: false, max: 'dataMax' },
      yAxis: {
        type: 'category',
        inverse: true,
        data: items.map((i) => i.label),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: {
          color: chartPalette.ink,
          fontFamily: FONT,
          fontSize: 12,
          formatter: (v: string) => (v.length > 18 ? v.slice(0, 17) + '…' : v),
        },
      },
      series: [
        {
          type: 'bar',
          data: items.map((i) => i.value),
          barWidth: 12,
          itemStyle: {
            borderRadius: 6,
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: chartPalette.sage },
                { offset: 1, color: chartPalette.sageInk },
              ],
            },
          },
          label: {
            show: true,
            position: 'right',
            distance: 8,
            color: chartPalette.sageInk,
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 600,
            formatter: (raw: unknown) => format(Number((raw as TP).value ?? 0)),
          },
        },
      ],
    }),
    [items, format],
  );

  return <EChart option={option} height={height} />;
}

/* ------------------------------------------------------------------ *
 * Donut — echarts pie + custom legend (keeps the design's percent list)
 * ------------------------------------------------------------------ */
export type DonutSegment = { label: string; value: number; color: string };

export function Donut({
  segments,
  centerLabel,
  centerValue,
  format,
  size = 176,
}: {
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
  format?: (v: number) => string;
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0);

  const option = useMemo<EChartsCoreOption>(
    () => ({
      title: centerValue
        ? {
            text: centerValue,
            left: 'center',
            top: 'center',
            textStyle: { color: chartPalette.ink, fontFamily: FONT, fontSize: 18, fontWeight: 600 },
          }
        : undefined,
      tooltip: {
        trigger: 'item',
        ...tooltipBase,
        formatter: (raw: unknown) => {
          const p = toList(raw)[0];
          const val = format ? format(Number(p?.value ?? 0)) : String(p?.value ?? 0);
          return `<div style="font-weight:600;margin-bottom:2px">${p?.name ?? ''}</div><div>${val} · ${p?.percent ?? 0}%</div>`;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['62%', '86%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          labelLine: { show: false },
          itemStyle: { borderColor: chartPalette.surface, borderWidth: 2 },
          data: segments.map((s) => ({
            name: s.label,
            value: Math.max(0, s.value),
            itemStyle: { color: s.color },
          })),
        },
      ],
    }),
    [segments, centerValue, format],
  );

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div style={{ width: size, height: size }} className="shrink-0">
        <EChart option={option} height={size} />
      </div>
      <div className="min-w-[140px] flex-1 space-y-2">
        {segments.map((seg, i) => {
          const pct = total > 0 ? Math.round((Math.max(0, seg.value) / total) * 100) : 0;
          return (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: seg.color }} />
              <span className="flex-1 truncate text-ink-soft">{seg.label}</span>
              <span className="nums shrink-0 font-medium text-ink">{pct}%</span>
            </div>
          );
        })}
        {centerLabel && total === 0 && <div className="text-sm text-ink-faint">{centerLabel}</div>}
      </div>
    </div>
  );
}
