'use client';

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
  return <div className={`rounded-xl border px-3.5 py-2.5 text-sm ${tones[tone]}`}>{children}</div>;
}
