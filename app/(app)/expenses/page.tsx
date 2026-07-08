'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { formatUAH, uahToKopiyky } from '@/lib/money';
import { EXPENSE_KINDS, type Expense, type ExpenseKind } from '@/lib/types';
import { EXPENSE_KIND_LABEL } from '@/lib/labels';
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  MoneyInput,
  PageHeader,
  Spinner,
  Stat,
} from '@/components/ui';
import { Select, type SelectOption } from '@/components/select';
import { DatePicker } from '@/components/datepicker';
import { Modal, useConfirm } from '@/components/modal';
import { useToast } from '@/components/toast';
import { IconExpenses, IconPlus, IconTrash, IconWallet } from '@/components/icons';

function todayKyiv() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
}

const EXPENSE_SELECT: SelectOption<ExpenseKind>[] = EXPENSE_KINDS.map((k) => ({
  value: k,
  label: EXPENSE_KIND_LABEL[k],
}));

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [kind, setKind] = useState<ExpenseKind>('RENT');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(todayKyiv());

  const toast = useToast();
  const confirm = useConfirm();

  async function load() {
    // Only real expenses (bulk supply buys, rent, salary…). Bouquet packaging is
    // income — a 100% add-on the client pays for — so it never shows up here.
    setExpenses(await api<Expense[]>('/expenses?scope=GENERAL'));
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const total = useMemo(() => expenses.reduce((s, e) => s + e.amountKopiyky, 0), [expenses]);

  function openCreate() {
    setKind('RENT');
    setAmount('');
    setDesc('');
    setDate(todayKyiv());
    setError('');
    setOpen(true);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setError('');
    setSaving(true);
    try {
      await api('/expenses', {
        method: 'POST',
        body: {
          scope: 'GENERAL',
          kind,
          amountKopiyky: uahToKopiyky(amount),
          incurredOn: date,
          description: desc || undefined,
        },
      });
      setOpen(false);
      toast.success('Витрату додано', `${EXPENSE_KIND_LABEL[kind]} · ${formatUAH(uahToKopiyky(amount))}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  }

  async function remove(exp: Expense) {
    const ok = await confirm({
      title: 'Видалити витрату?',
      description: `${EXPENSE_KIND_LABEL[exp.kind]} на ${formatUAH(exp.amountKopiyky)} буде видалено.`,
      confirmText: 'Видалити',
      danger: true,
    });
    if (!ok) return;
    await api(`/expenses/${exp.id}`, { method: 'DELETE' });
    toast.success('Витрату видалено');
    await load();
  }

  if (loading) return <Spinner label="Завантажуємо витрати…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Витрати"
        subtitle="Оптові закупівлі (пакування, матеріали) та постійні витрати студії"
        actions={
          <Button onClick={openCreate}>
            <IconPlus width={18} height={18} /> Додати витрату
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4">
        <Stat
          label="Разом витрат"
          value={formatUAH(total)}
          sub="оптові закупівлі + постійні"
          tone="clay"
          icon={<IconExpenses width={18} height={18} />}
        />
        <Stat
          label="Записів"
          value={String(expenses.length)}
          sub="за весь час"
          icon={<IconWallet width={18} height={18} />}
        />
      </div>

      <Card className="overflow-hidden">
        {expenses.length === 0 ? (
          <EmptyState
            icon={<IconExpenses width={26} height={26} />}
            title="Витрат ще немає"
            description="Додайте оптову закупівлю пакування, оренду чи рекламу — вони зменшать чистий дохід у звітах."
            action={
              <Button onClick={openCreate}>
                <IconPlus width={18} height={18} /> Додати витрату
              </Button>
            }
          />
        ) : (
          <>
            {/* Mobile: tappable cards (no horizontal scroll) */}
            <div className="lg:hidden">
              <ul className="divide-y divide-line">
                {expenses.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-ink">{EXPENSE_KIND_LABEL[e.kind]}</div>
                      <div className="mt-0.5 truncate text-xs text-ink-faint">
                        {e.incurredOn}
                        {e.description ? ` · ${e.description}` : ''}
                      </div>
                    </div>
                    <div className="nums shrink-0 font-semibold text-ink">{formatUAH(e.amountKopiyky)}</div>
                    <IconButton label="Видалити" tone="clay" onClick={() => remove(e)}>
                      <IconTrash width={18} height={18} />
                    </IconButton>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-line bg-surface-soft px-4 py-3 text-sm">
                <span className="font-semibold uppercase tracking-wide text-ink-faint">Разом</span>
                <span className="nums font-semibold text-ink">{formatUAH(total)}</span>
              </div>
            </div>

            {/* Desktop: full table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3">Дата</th>
                  <th className="px-5 py-3">Тип</th>
                  <th className="px-5 py-3">Опис</th>
                  <th className="px-5 py-3 text-right">Сума</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {expenses.map((e) => (
                  <tr key={e.id} className="group transition-colors hover:bg-surface-soft">
                    <td className="nums px-5 py-3 text-ink-soft">{e.incurredOn}</td>
                    <td className="px-5 py-3 font-medium text-ink">{EXPENSE_KIND_LABEL[e.kind]}</td>
                    <td className="px-5 py-3 text-ink-soft">{e.description || '—'}</td>
                    <td className="nums px-5 py-3 text-right font-medium text-ink">{formatUAH(e.amountKopiyky)}</td>
                    <td className="px-5 py-3 text-right">
                      <IconButton
                        label="Видалити"
                        tone="clay"
                        className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                        onClick={() => remove(e)}
                      >
                        <IconTrash width={17} height={17} />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-line bg-surface-soft">
                  <td className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-faint" colSpan={3}>
                    Разом
                  </td>
                  <td className="nums px-5 py-3 text-right font-semibold text-ink">{formatUAH(total)}</td>
                  <td></td>
                </tr>
              </tfoot>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Add modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Нова загальна витрата"
        description="Оренда, зарплата, реклама, податки — зменшують чистий дохід студії."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button form="expense-form" type="submit" disabled={saving}>
              {saving ? 'Збереження…' : 'Додати'}
            </Button>
          </>
        }
      >
        <form id="expense-form" onSubmit={add} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Тип">
              <Select value={kind} onChange={setKind} options={EXPENSE_SELECT} ariaLabel="Тип витрати" />
            </Field>
            <Field label="Сума">
              <MoneyInput value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required autoFocus />
            </Field>
          </div>
          <Field label="Дата">
            <DatePicker value={date} onChange={setDate} />
          </Field>
          <Field label="Опис" hint="необов’язково">
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Оренда за липень" />
          </Field>
          {error && <div className="rounded-xl bg-clay-tint px-3.5 py-2.5 text-sm text-clay-ink">{error}</div>}
        </form>
      </Modal>
    </div>
  );
}
