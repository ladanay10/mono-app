'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { formatUAH, uahToKopiyky } from '@/lib/money';
import { todayKyiv } from '@/lib/date';
import { EXPENSE_KINDS, type Expense, type ExpenseKind } from '@/lib/types';
import { EXPENSE_KIND_LABEL } from '@/lib/labels';
import { Button, Field, IconButton, Input, MoneyInput } from '@/components/ui';
import { Select, type SelectOption } from '@/components/select';
import { Modal } from '@/components/modal';
import { IconX } from '@/components/icons';

const EXPENSE_SELECT: SelectOption<ExpenseKind>[] = EXPENSE_KINDS.map((k) => ({
  value: k,
  label: EXPENSE_KIND_LABEL[k],
}));

/**
 * «Інші витрати» — add/list/delete bouquet expenses other than flowers.
 * The list also renders inline at the bottom of the «Склад букета» table.
 */
export function ExpensesModal({
  open,
  onClose,
  bouquetId,
  expenses,
  run,
  disabled,
}: {
  open: boolean;
  onClose: () => void;
  bouquetId: string;
  expenses: Expense[];
  run: (fn: () => Promise<unknown>, ok?: string) => Promise<void>;
  disabled: boolean;
}) {
  const [kind, setKind] = useState<ExpenseKind>('PACKAGING');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  const total = expenses.reduce((s, e) => s + e.amountKopiyky, 0);

  // The footer's primary action saves — there is no separate «+» button.
  async function add() {
    if (!amount) return;
    await run(async () => {
      await api('/expenses', {
        method: 'POST',
        body: {
          scope: 'BOUQUET',
          bouquetId,
          kind,
          amountKopiyky: uahToKopiyky(amount),
          incurredOn: todayKyiv(),
          description: desc || undefined,
        },
      });
      setAmount('');
      setDesc('');
    }, 'Надбавку додано');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Надбавки"
      description="Пакування, доставка тощо — клієнт платить, це 100% навар. Закупівлю трекай у «Витрати»."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Скасувати
          </Button>
          <Button onClick={add} disabled={disabled || !amount}>
            Додати
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {expenses.length > 0 ? (
          <div>
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
              {expenses.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="text-ink">{EXPENSE_KIND_LABEL[e.kind]}</span>
                    {e.description && <span className="ml-1.5 text-ink-faint">· {e.description}</span>}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="nums font-medium text-ink">{formatUAH(e.amountKopiyky)}</span>
                    {!disabled && (
                      <IconButton
                        label="Видалити"
                        tone="clay"
                        onClick={() => run(() => api(`/expenses/${e.id}`, { method: 'DELETE' }))}
                      >
                        <IconX width={15} height={15} />
                      </IconButton>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center justify-between px-1 text-sm">
              <span className="text-ink-soft">Разом</span>
              <span className="nums font-semibold text-ink">{formatUAH(total)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-faint">Поки немає надбавок на цьому букеті.</p>
        )}

        {!disabled && (
          <div className="rounded-xl border border-line bg-surface-soft p-3">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Тип">
                <Select value={kind} onChange={setKind} options={EXPENSE_SELECT} ariaLabel="Тип надбавки" />
              </Field>
              <Field label="Сума">
                <MoneyInput value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
              </Field>
            </div>
            <Field label="Опис" className="mt-2.5">
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="стрічка…" />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}
