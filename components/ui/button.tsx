'use client';

import { forwardRef } from 'react';

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
