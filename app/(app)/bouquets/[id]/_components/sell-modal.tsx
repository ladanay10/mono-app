'use client';

import { useEffect, useState } from 'react';
import { formatUAH, kopiykyToUah, uahToKopiyky } from '@/lib/money';
import { todayKyiv } from '@/lib/date';
import { Alert, Button, Field, MoneyInput } from '@/components/ui';
import { DatePicker } from '@/components/datepicker';
import { Modal } from '@/components/modal';
import { IconCheck, IconWallet } from '@/components/icons';

export function SellModal({
  open,
  onClose,
  revenue,
  onSell,
}: {
  open: boolean;
  onClose: () => void;
  revenue: number;
  onSell: (soldOn: string, amountReceivedKopiyky?: number) => void;
}) {
  const [soldOn, setSoldOn] = useState(todayKyiv());
  const [received, setReceived] = useState('');

  useEffect(() => {
    if (open) {
      setSoldOn(todayKyiv());
      setReceived(String(kopiykyToUah(revenue)));
    }
  }, [open, revenue]);

  const receivedK = uahToKopiyky(received);
  const owed = revenue - receivedK;
  const fullyPaid = owed <= 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Продаж букета"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Скасувати
          </Button>
          <Button onClick={() => onSell(soldOn, received !== '' ? receivedK : undefined)}>
            <IconWallet width={17} height={17} /> Продати
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-surface-sunk px-4 py-3">
          <span className="text-sm text-ink-soft">Сума букета</span>
          <span className="nums text-xl font-semibold text-bloom-ink">{formatUAH(revenue)}</span>
        </div>

        <Field label="Дата продажу">
          <DatePicker value={soldOn} onChange={setSoldOn} />
        </Field>

        <Field label="Отримано готівкою">
          <MoneyInput value={received} onChange={(e) => setReceived(e.target.value)} placeholder="0" />
          <div className="mt-2 flex items-center justify-between gap-2">
            {fullyPaid ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-sage-ink">
                <IconCheck width={14} height={14} /> Оплачено повністю
              </span>
            ) : (
              <span className="text-xs font-medium text-clay-ink">Борг: {formatUAH(owed)}</span>
            )}
            {!fullyPaid && (
              <button
                type="button"
                onClick={() => setReceived(String(kopiykyToUah(revenue)))}
                className="cursor-pointer text-xs font-medium text-bloom-ink hover:underline"
              >
                Оплачено повністю
              </button>
            )}
          </div>
        </Field>

        <Alert tone="gold">
          Після продажу склад букета не можна змінити. Щоб переробити — «Клонувати» в нову чернетку.
        </Alert>
      </div>
    </Modal>
  );
}
