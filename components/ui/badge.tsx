'use client';

import type { BouquetStatus } from '@/lib/types';
import { STATUS_LABEL, STATUS_TONE, type Tone } from '@/lib/labels';

const TONE_BADGE: Record<Tone, string> = {
  ink: 'bg-ink/[0.06] text-ink-soft',
  bloom: 'bg-bloom-tint text-bloom-ink',
  sage: 'bg-sage-tint text-sage-ink',
  clay: 'bg-clay-tint text-clay-ink',
  gold: 'bg-gold-tint text-gold-ink',
};

export function Badge({
  children,
  tone = 'ink',
  className = '',
  dot = false,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  const dotColor: Record<Tone, string> = {
    ink: 'bg-ink-faint',
    bloom: 'bg-bloom',
    sage: 'bg-sage',
    clay: 'bg-clay',
    gold: 'bg-gold',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_BADGE[tone]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColor[tone]}`} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: BouquetStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
