'use client';

import { useState } from 'react';
import { uahToKopiyky } from '@/lib/money';
import { type Unit } from '@/lib/types';
import { Button, Field, Input, MoneyInput } from '@/components/ui';
import { Modal } from '@/components/modal';
import { IconPlus } from '@/components/icons';

export function CustomLineModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (body: {
    itemName: string;
    unit: Unit;
    purchasePriceKopiyky: number;
    salePriceKopiyky: number;
    quantity: number;
  }) => void;
}) {
  const [name, setName] = useState('');
  const [purchase, setPurchase] = useState('');
  const [sale, setSale] = useState('');
  const [quantity, setQuantity] = useState('1');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Своя позиція"
      description="Разова «ринкова» квітка, якої немає в каталозі."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Скасувати
          </Button>
          <Button
            disabled={!name || !quantity}
            onClick={() =>
              onAdd({
                itemName: name,
                unit: 'PIECE',
                purchasePriceKopiyky: uahToKopiyky(purchase),
                salePriceKopiyky: uahToKopiyky(sale),
                quantity: Number(quantity),
              })
            }
          >
            <IconPlus width={17} height={17} /> Додати
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Назва">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Півонія (ринок)" autoFocus />
        </Field>
        <Field label="К-сть (шт)">
          <Input
            type="number"
            step="0.001"
            min="0.001"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="nums text-right"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Закупівельна">
            <MoneyInput value={purchase} onChange={(e) => setPurchase(e.target.value)} placeholder="0" />
          </Field>
          <Field label="Продажна">
            <MoneyInput value={sale} onChange={(e) => setSale(e.target.value)} placeholder="0" />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
