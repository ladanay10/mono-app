'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Recipe } from '@/lib/types';
import { Button, IconButton, Spinner } from '@/components/ui';
import { Modal, useConfirm } from '@/components/modal';
import { useToast } from '@/components/toast';
import { IconPlus, IconX } from '@/components/icons';

export function TemplatesModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (bouquetId: string) => void;
}) {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    if (!open) return;
    setRecipes(null);
    api<Recipe[]>('/recipes')
      .then(setRecipes)
      .catch(() => setRecipes([]));
  }, [open]);

  async function use(r: Recipe) {
    setBusyId(r.id);
    try {
      const b = await api<{ id: string }>(`/recipes/${r.id}/use`, { method: 'POST' });
      onCreated(b.id);
    } catch (e) {
      toast.error('Не вдалося', e instanceof Error ? e.message : 'Спробуйте ще раз');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(r: Recipe) {
    const ok = await confirm({
      title: 'Видалити шаблон?',
      description: `«${r.name}» буде видалено.`,
      confirmText: 'Видалити',
      danger: true,
    });
    if (!ok) return;
    await api(`/recipes/${r.id}`, { method: 'DELETE' });
    toast.success('Шаблон видалено');
    setRecipes((prev) => prev?.filter((x) => x.id !== r.id) ?? null);
  }

  const summary = (r: Recipe) =>
    r.lines.map((l) => `${Number(l.quantity)}× ${l.itemNameSnapshot}`).join(', ');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Шаблони букетів"
      description="Збережені склади — створи букет в один клік."
      size="md"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Закрити
        </Button>
      }
    >
      {recipes === null ? (
        <div className="py-8">
          <Spinner label="Завантажуємо шаблони…" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="py-8 text-center text-sm text-ink-faint">
          Ще немає шаблонів. Збери букет і натисни «Шаблон» на його сторінці, щоб зберегти склад.
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {recipes.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-ink">{r.name}</div>
                <div className="truncate text-xs text-ink-faint">{summary(r) || '—'}</div>
              </div>
              <Button size="sm" onClick={() => use(r)} disabled={busyId === r.id}>
                <IconPlus width={16} height={16} /> {busyId === r.id ? 'Створюємо…' : 'Створити'}
              </Button>
              <IconButton label="Видалити" tone="clay" onClick={() => remove(r)}>
                <IconX width={16} height={16} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
