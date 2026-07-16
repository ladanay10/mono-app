"use client";

import { forwardRef } from "react";

export function Label({
  children,
  className = "",
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={`mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-soft ${className}`}
    >
      {children}
    </label>
  );
}

// text-base (16px) on mobile is deliberate: iOS Safari auto-zooms — and yanks the
// viewport around — whenever a focused control's font-size is under 16px.
const FIELD_BASE =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-base sm:text-sm text-ink placeholder:text-ink-faint outline-none transition-colors duration-150 focus:border-line-strong disabled:cursor-not-allowed disabled:bg-surface-sunk disabled:text-ink-faint";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className = "", ...props }, ref) {
  return (
    <input ref={ref} {...props} className={`${FIELD_BASE} h-10 ${className}`} />
  );
});

/* input with a trailing unit/adornment (e.g. ₴) */
export function MoneyInput({
  className = "",
  suffix = "₴",
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

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${FIELD_BASE} min-h-20 py-2.5 ${className}`}
    />
  );
}

/* labelled field wrapper */
export function Field({
  label,
  hint,
  children,
  className = "",
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
