'use client';

import { forwardRef } from 'react';
import type { BouquetStatus } from '@/lib/types';
import { STATUS_LABEL, STATUS_TONE, type Tone } from '@/lib/labels';

/* ------------------------------------------------------------------ *
 * Button
 * ------------------------------------------------------------------ */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-bloom text-white shadow-soft hover:bg-bloom-strong active:translate-y-px disabled:bg-bloom/45',
  secondary:
    'bg-surface text-ink border border-line-strong hover:bg-surface-soft hover:border-ink-faint/60 active:translate-y-px disabled:opacity-50',
  ghost:
    'bg-transparent text-ink-soft hover:bg-ink/5 hover:text-ink active:translate-y-px disabled:opacity-50',
  danger:
    'bg-clay-tint text-clay-ink border border-clay/25 hover:bg-clay hover:text-white active:translate-y-px disabled:opacity-50',
};

const BTN_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-[13px]',
  md: 'h-10 gap-2 px-4 text-sm',
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  }
>(function Button({ variant = 'primary', size = 'md', className = '', ...props }, ref) {
  return (
    <button
      ref={ref}
      {...props}
      className={`inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-xl font-medium transition-[background,color,border-color,transform,opacity] duration-150 disabled:cursor-not-allowed disabled:active:translate-y-0 ${BTN_SIZES[size]} ${BTN_VARIANTS[variant]} ${className}`}
    />
  );
});

/* icon-only button (table row actions) */
export function IconButton({
  label,
  tone = 'ink',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'ink' | 'bloom' | 'clay' }) {
  const tones = {
    ink: 'text-ink-faint hover:bg-ink/5 hover:text-ink',
    bloom: 'text-ink-faint hover:bg-bloom-tint hover:text-bloom-ink',
    clay: 'text-ink-faint hover:bg-clay-tint hover:text-clay-ink',
  };
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={`inline-grid h-8 w-8 cursor-pointer place-items-center rounded-lg transition-colors duration-150 ${tones[tone]} ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ *
 * Card
 * ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ *
 * Badge / StatusBadge
 * ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ *
 * Form primitives
 * ------------------------------------------------------------------ */
export function Label({ children, className = '', ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={`mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-soft ${className}`}
    >
      {children}
    </label>
  );
}

const FIELD_BASE =
  'w-full rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-[border-color,box-shadow] duration-150 focus:border-bloom focus:ring-4 focus:ring-bloom/12 disabled:cursor-not-allowed disabled:bg-surface-sunk disabled:text-ink-faint';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...props }, ref) {
    return <input ref={ref} {...props} className={`${FIELD_BASE} h-10 ${className}`} />;
  },
);

/* input with a leading unit/adornment (e.g. ₴) */
export function MoneyInput({
  className = '',
  suffix = '₴',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { suffix?: string }) {
  return (
    <div className="relative">
      <input
        {...props}
        inputMode="decimal"
        className={`${FIELD_BASE} nums h-10 pr-9 text-right ${className}`}
      />
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
        {suffix}
      </span>
    </div>
  );
}

export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${FIELD_BASE} min-h-20 py-2.5 ${className}`} />;
}

/* labelled field wrapper */
export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <Label>{label}</Label>}
      {children}
      {hint && <div className="mt-1 text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Segmented control (small tab/filter switcher)
 * ------------------------------------------------------------------ */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className = '',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div className={`inline-flex rounded-xl border border-line bg-surface-sunk p-1 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
              active ? 'bg-surface text-ink shadow-soft' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Page header
 * ------------------------------------------------------------------ */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Stat card
 * ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ *
 * Empty state
 * ------------------------------------------------------------------ */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
      {icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-bloom-tint text-bloom">{icon}</div>
      )}
      <div className="text-base font-semibold text-ink">{title}</div>
      {description && <div className="mt-1 max-w-sm text-sm text-ink-soft">{description}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Loading
 * ------------------------------------------------------------------ */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-lg bg-surface-sunk ${className}`} />;
}

export function Spinner({ label = 'Завантаження…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-16 text-sm text-ink-faint">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-bloom" />
      {label}
    </div>
  );
}

/* thin inline alert (form errors etc.) */
export function Alert({ children, tone = 'clay' }: { children: React.ReactNode; tone?: 'clay' | 'gold' }) {
  const tones = {
    clay: 'bg-clay-tint text-clay-ink border-clay/20',
    gold: 'bg-gold-tint text-gold-ink border-gold/20',
  };
  return (
    <div className={`rounded-xl border px-3.5 py-2.5 text-sm ${tones[tone]}`}>{children}</div>
  );
}
