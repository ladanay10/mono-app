'use client';

import { useMemo } from 'react';
import type { EChartsCoreOption } from 'echarts/core';
import { EChart } from '@/components/echart';
import { formatUahCompact } from '@/lib/money';

/* Brand palette in hex (canvas can't resolve CSS vars). Mirrors globals.css. */
export const chartPalette = {
  bloom: '#ffffff',
  bloomInk: '#ffffff',
  sage: '#34d399',
  sageInk: '#6ee7b7',
  clay: '#f4716e',
  gold: '#f5b85a',
  ink: '#f3f4f6',
  inkSoft: '#a1a5b0',
  inkFaint: '#6b7080',
  line: '#262a33',
  sunk: '#101217',
  surface: '#16181f',
};

/* hex → rgba, for chart gradients that key off a palette colour */
export function withAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const FONT = 'Inter, ui-sans-serif, system-ui, sans-serif';

const tooltipBase = {
  backgroundColor: chartPalette.surface,
  borderColor: chartPalette.line,
  borderWidth: 1,
  padding: [8, 12] as [number, number],
  textStyle: { color: chartPalette.ink, fontFamily: FONT, fontSize: 12 },
  extraCssText: 'border-radius:12px;box-shadow:0 12px 32px -8px rgba(0,0,0,0.7);',
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
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.05)' } },
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
 * Area / line — a smooth trend (e.g. profit margin % over months)
 * ------------------------------------------------------------------ */
export type Point = { label: string; value: number };

export function AreaChart({
  points,
  format,
  height = 200,
  color = chartPalette.sage,
}: {
  points: Point[];
  format: (v: number) => string;
  height?: number;
  color?: string;
}) {
  const option = useMemo<EChartsCoreOption>(
    () => ({
      grid: { left: 6, right: 14, top: 18, bottom: 2, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: chartPalette.line, width: 1 } },
        ...tooltipBase,
        formatter: (raw: unknown) => {
          const p = toList(raw)[0];
          return `<div style="font-weight:600;margin-bottom:2px">${p?.axisValue ?? ''}</div><div>${format(Number(p?.value ?? 0))}</div>`;
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: points.map((p) => p.label),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: chartPalette.line } },
        axisLabel: { color: chartPalette.inkFaint, fontFamily: FONT, fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: chartPalette.inkFaint,
          fontFamily: FONT,
          fontSize: 11,
          formatter: (v: number) => format(v),
        },
        splitLine: { lineStyle: { color: chartPalette.line, type: 'dashed' } },
      },
      series: [
        {
          type: 'line',
          data: points.map((p) => p.value),
          smooth: true,
          symbol: 'circle',
          symbolSize: 7,
          showSymbol: points.length <= 12,
          lineStyle: { width: 3, color, shadowColor: withAlpha(color, 0.5), shadowBlur: 12 },
          itemStyle: { color, borderColor: chartPalette.surface, borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: withAlpha(color, 0.35) },
                { offset: 1, color: withAlpha(color, 0.02) },
              ],
            },
          },
        },
      ],
    }),
    [points, format, color],
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
