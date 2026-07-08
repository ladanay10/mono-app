'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatUAH } from '@/lib/money';
import { type CatalogItem } from '@/lib/types';
import { UNIT_LABEL } from '@/lib/labels';
import { Button, Input } from '@/components/ui';
import { Modal } from '@/components/modal';
import { IconMinus, IconPlus, IconSearch } from '@/components/icons';

/**
 * Catalog picker — touch-friendly batch add with quantity steppers.
 */
export function AddLinesModal({
  open,
  onClose,
  catalog,
  onConfirm,
  onCustom,
}: {
  open: boolean;
  onClose: () => void;
  catalog: CatalogItem[];
  onConfirm: (selections: { catalogItemId: string; quantity: number }[]) => Promise<void>;
  onCustom: () => void;
}) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setQty({});
      setQuery('');
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.category?.toLowerCase().includes(q),
    );
  }, [catalog, query]);

  const selected = catalog.filter((c) => (qty[c.id] ?? 0) > 0);
  const count = selected.length;
  const previewTotal = selected.reduce((s, c) => s + (qty[c.id] ?? 0) * c.salePriceKopiyky, 0);

  const setN = (id: string, n: number) => setQty((prev) => ({ ...prev, [id]: Math.max(0, n) }));

  async function confirm() {
    if (count === 0) return;
    setSaving(true);
    try {
      await onConfirm(selected.map((c) => ({ catalogItemId: c.id, quantity: qty[c.id] })));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Додати квіти"
      description="Наберіть кількість по кожній позиції"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="ghost" onClick={onCustom}>
            Своя позиція
          </Button>
          <div className="flex items-center gap-3">
            {count > 0 && (
              <span className="nums hidden text-sm text-ink-soft sm:inline">{formatUAH(previewTotal)}</span>
            )}
            <Button onClick={confirm} disabled={count === 0 || saving}>
              <IconPlus width={18} height={18} />
              {saving ? 'Додаємо…' : count > 0 ? `Додати ${count}` : 'Додати'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="-m-5 flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-line px-5 py-3">
          <div className="relative">
            <IconSearch
              width={18}
              height={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <Input
              placeholder="Пошук квітки…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {catalog.length === 0 ? (
            <div className="py-10 text-center text-sm text-ink-faint">
              Каталог порожній — спершу додайте позиції в розділі «Каталог».
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-ink-faint">Нічого не знайдено</div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((c) => {
                const n = qty[c.id] ?? 0;
                const active = n > 0;
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                      active ? 'border-bloom/30 bg-bloom-tint' : 'border-line bg-surface'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">{c.name}</div>
                      <div className="nums text-xs text-ink-faint">
                        {formatUAH(c.salePriceKopiyky)}/{UNIT_LABEL[c.unit]}
                      </div>
                    </div>
                    <QtyStepper n={n} onInc={() => setN(c.id, n + 1)} onDec={() => setN(c.id, n - 1)} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function QtyStepper({ n, onInc, onDec }: { n: number; onInc: () => void; onDec: () => void }) {
  if (n === 0) {
    return (
      <button
        type="button"
        onClick={onInc}
        aria-label="Додати"
        className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full border border-line-strong bg-surface text-ink-soft transition-colors hover:border-bloom hover:text-bloom"
      >
        <IconPlus width={18} height={18} />
      </button>
    );
  }
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-bloom/30 bg-surface p-1">
      <button
        type="button"
        onClick={onDec}
        aria-label="Менше"
        className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-bloom transition-colors hover:bg-bloom-tint"
      >
        <IconMinus width={16} height={16} />
      </button>
      <span className="nums w-7 text-center text-sm font-semibold text-ink">{n}</span>
      <button
        type="button"
        onClick={onInc}
        aria-label="Більше"
        className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-bloom transition-colors hover:bg-bloom-tint"
      >
        <IconPlus width={16} height={16} />
      </button>
    </div>
  );
}
