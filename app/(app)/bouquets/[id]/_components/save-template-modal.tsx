'use client';

import { useState } from 'react';
import { Button, Field, Input } from '@/components/ui';
import { Modal } from '@/components/modal';

export function SaveTemplateModal({
  open,
  onClose,
  defaultName,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  defaultName: string;
  onSave: (name: string) => void;
}) {
  // Fresh state on each open — the parent remounts this via `key`.
  const [name, setName] = useState(defaultName);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Зберегти як шаблон"
      description="Склад букета збережеться як шаблон. Ціни підтягуватимуться свіжі з каталогу при кожному використанні."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Скасувати
          </Button>
          <Button disabled={!name.trim()} onClick={() => onSave(name.trim())}>
            Зберегти
          </Button>
        </>
      }
    >
      <Field label="Назва шаблону">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Класичний букет" autoFocus />
      </Field>
    </Modal>
  );
}
