'use client';

import type { Tone } from '@/lib/labels';

export function Card({
  children,
  className = '',
  as: As = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <As className={`rounded-2xl border border-line bg-surface shadow-card ${className}`}>{children}</As>
  );
}

export function CardHeader({
  title,
  right,
  className = '',
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b border-line px-5 py-3.5 ${className}`}>
      <div className="text-sm font-semibold text-ink">{title}</div>
      {right}
    </div>
  );
}

/* stat card — a labelled metric with optional icon */
export function Stat({
  label,
  value,
  sub,
  icon,
  tone = 'ink',
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
}) {
  const valueColor: Record<Tone, string> = {
    ink: 'text-ink',
    bloom: 'text-bloom-ink',
    sage: 'text-sage-ink',
    clay: 'text-clay-ink',
    gold: 'text-gold-ink',
  };
  const iconWrap: Record<Tone, string> = {
    ink: 'bg-ink/[0.06] text-ink-soft',
    bloom: 'bg-bloom-tint text-bloom',
    sage: 'bg-sage-tint text-sage',
    clay: 'bg-clay-tint text-clay',
    gold: 'bg-gold-tint text-gold',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[13px] font-medium text-ink-soft">{label}</div>
        {icon && <span className={`grid h-9 w-9 place-items-center rounded-xl ${iconWrap[tone]}`}>{icon}</span>}
      </div>
      <div className={`nums mt-3 text-[26px] font-semibold leading-none ${valueColor[tone]}`}>{value}</div>
      {sub && <div className="mt-2 text-xs text-ink-faint">{sub}</div>}
    </Card>
  );
}
