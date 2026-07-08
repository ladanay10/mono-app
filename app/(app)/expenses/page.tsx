'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { formatUAH, uahToKopiyky } from '@/lib/money';
import { EXPENSE_KINDS, type Expense, type ExpenseKind } from '@/lib/types';
import { EXPENSE_KIND_LABEL } from '@/lib/labels';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  MoneyInput,
  PageHeader,
  Segmented,
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

type ScopeFilter = 'ALL' | 'GENERAL' | 'BOUQUET';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<ScopeFilter>('ALL');

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
    setExpenses(await api<Expense[]>('/expenses'));
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (scope === 'ALL' ? expenses : expenses.filter((e) => e.scope === scope)),
    [expenses, scope],
  );

  const total = useMemo(() => filtered.reduce((s, e) => s + e.amountKopiyky, 0), [filtered]);
  const generalTotal = useMemo(
    () => expenses.filter((e) => e.scope === 'GENERAL').reduce((s, e) => s + e.amountKopiyky, 0),
    [expenses],
  );

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
        subtitle="Загальні витрати студії та витрати, прив’язані до букетів"
        actions={
          <Button onClick={openCreate}>
            <IconPlus width={18} height={18} /> Додати витрату
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Витрат у списку"
          value={formatUAH(total)}
          sub={`${filtered.length} записів`}
          tone="clay"
          icon={<IconExpenses width={18} height={18} />}
        />
        <Stat
          label="Загальні витрати"
          value={formatUAH(generalTotal)}
          sub="оренда, зарплата, реклама…"
          icon={<IconWallet width={18} height={18} />}
        />
        <Stat label="Усього записів" value={String(expenses.length)} sub="за весь час" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Segmented
          value={scope}
          onChange={setScope}
          options={[
            { value: 'ALL', label: 'Усі' },
            { value: 'GENERAL', label: 'Загальні' },
            { value: 'BOUQUET', label: 'По букетах' },
          ]}
        />
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<IconExpenses width={26} height={26} />}
            title={expenses.length === 0 ? 'Витрат ще немає' : 'Нічого не знайдено'}
            description={
              expenses.length === 0
                ? 'Додайте оренду, зарплату чи рекламу — вони зменшать чистий дохід у звітах.'
                : 'Змініть фільтр, щоб побачити інші витрати.'
            }
            action={
              expenses.length === 0 ? (
                <Button onClick={openCreate}>
                  <IconPlus width={18} height={18} /> Додати витрату
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3">Дата</th>
                  <th className="px-5 py-3">Тип</th>
                  <th className="px-5 py-3">Область</th>
                  <th className="px-5 py-3">Опис</th>
                  <th className="px-5 py-3 text-right">Сума</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((e) => (
                  <tr key={e.id} className="group transition-colors hover:bg-surface-soft">
                    <td className="nums px-5 py-3 text-ink-soft">{e.incurredOn}</td>
                    <td className="px-5 py-3 font-medium text-ink">{EXPENSE_KIND_LABEL[e.kind]}</td>
                    <td className="px-5 py-3">
                      <Badge tone={e.scope === 'GENERAL' ? 'gold' : 'bloom'}>
                        {e.scope === 'GENERAL' ? 'Загальна' : 'Букет'}
                      </Badge>
                    </td>
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
                  <td className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-faint" colSpan={4}>
                    Разом
                  </td>
                  <td className="nums px-5 py-3 text-right font-semibold text-ink">{formatUAH(total)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
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
