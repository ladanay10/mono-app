'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatBps, formatUAH, kopiykyToUah, uahToKopiyky } from '@/lib/money';
import {
  EXPENSE_KINDS,
  type BouquetDetail,
  type CatalogItem,
  type Expense,
  type ExpenseKind,
  type Unit,
} from '@/lib/types';
import { EXPENSE_KIND_LABEL, UNIT_LABEL } from '@/lib/labels';
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  IconButton,
  Input,
  MoneyInput,
  Spinner,
  StatusBadge,
} from '@/components/ui';
import { Select, type SelectOption } from '@/components/select';
import { DatePicker } from '@/components/datepicker';
import { Modal, useConfirm } from '@/components/modal';
import { useToast } from '@/components/toast';
import {
  IconBouquet,
  IconCheck,
  IconChevronLeft,
  IconCopy,
  IconMinus,
  IconPlus,
  IconSearch,
  IconTrash,
  IconWallet,
  IconX,
} from '@/components/icons';

function todayKyiv() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
}

function pluralUk(n: number, one: string, few: string, many: string) {
  const d = Math.abs(n) % 100;
  const d1 = d % 10;
  if (d > 10 && d < 20) return many;
  if (d1 === 1) return one;
  if (d1 >= 2 && d1 <= 4) return few;
  return many;
}

const EXPENSE_SELECT: SelectOption<ExpenseKind>[] = EXPENSE_KINDS.map((k) => ({
  value: k,
  label: EXPENSE_KIND_LABEL[k],
}));

export default function BouquetPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [detail, setDetail] = useState<BouquetDetail | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [sellOpen, setSellOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [title, setTitle] = useState('');

  const load = useCallback(async () => {
    const [d, exp] = await Promise.all([
      api<BouquetDetail>(`/bouquets/${id}`),
      api<Expense[]>(`/expenses?bouquetId=${id}`),
    ]);
    setDetail(d);
    setTitle(d.title ?? '');
    setExpenses(exp);
  }, [id]);

  useEffect(() => {
    Promise.all([load(), api<CatalogItem[]>('/catalog').then(setCatalog)]).finally(() => setLoading(false));
  }, [load]);

  const run = useCallback(
    async (fn: () => Promise<unknown>, okMsg?: string) => {
      try {
        await fn();
        await load();
        if (okMsg) toast.success(okMsg);
      } catch (err) {
        toast.error('Не вдалося', err instanceof Error ? err.message : 'Спробуйте ще раз');
      }
    },
    [load, toast],
  );

  if (loading || !detail) return <Spinner label="Відкриваємо букет…" />;

  const isDraft = detail.status === 'DRAFT';
  const isConfirmed = detail.status === 'CONFIRMED';
  const isSold = detail.status === 'SOLD';
  const cancelled = detail.status === 'CANCELLED';
  const canEditHeader = isDraft || isConfirmed;
  const p = detail.profit;
  const expensesTotal = expenses.reduce((s, e) => s + e.amountKopiyky, 0);

  async function addLines(selections: { catalogItemId: string; quantity: number }[]) {
    if (selections.length === 0) return;
    await run(async () => {
      for (const s of selections) {
        await api(`/bouquets/${id}/lines`, {
          method: 'POST',
          body: { catalogItemId: s.catalogItemId, quantity: s.quantity },
        });
      }
      setPickerOpen(false);
    }, `Додано позицій: ${selections.length}`);
  }

  async function saveTitle() {
    if ((detail!.title ?? '') === title.trim() || !canEditHeader) return;
    await run(
      () => api(`/bouquets/${id}`, { method: 'PATCH', body: { title: title.trim() || null } }),
    );
  }

  const cost = p?.flowersCostKopiyky ?? 0;
  const bouqExp = p?.bouquetExpensesKopiyky ?? 0;
  const revenue = p?.revenueKopiyky ?? 0;
  const net = p?.netProfitKopiyky ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/bouquets"
          className="inline-flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          <IconChevronLeft width={16} height={16} /> Усі букети
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {canEditHeader ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                placeholder="Без назви"
                aria-label="Назва букета"
                className="-ml-1 w-full max-w-lg rounded-lg border border-transparent bg-transparent px-1 font-display text-3xl font-semibold text-ink outline-none transition-colors placeholder:text-ink-faint hover:border-line focus:border-bloom focus:bg-surface"
              />
            ) : (
              <h1 className="font-display text-3xl font-semibold text-ink">{detail.title || 'Без назви'}</h1>
            )}
            <div className="mt-2 flex items-center gap-3">
              <StatusBadge status={detail.status} />
              <span className="text-xs text-ink-faint">
                Створено {new Date(detail.createdAt).toLocaleDateString('uk-UA')}
                {detail.soldOn && ` · продано ${detail.soldOn}`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(isDraft || isConfirmed) && (
              <Button onClick={() => setSellOpen(true)}>
                <IconWallet width={18} height={18} /> Продати
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() =>
                run(async () => {
                  const c = await api<{ id: string }>(`/bouquets/${id}/clone`, { method: 'POST' });
                  router.push(`/bouquets/${c.id}`);
                })
              }
            >
              <IconCopy width={17} height={17} /> Клонувати
            </Button>
            {isConfirmed && (
              <Button
                variant="ghost"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Скасувати букет?',
                    description: 'Букет позначиться як скасований. Це не видалення — історія збережеться.',
                    confirmText: 'Скасувати букет',
                    cancelText: 'Ні',
                    danger: true,
                  });
                  if (ok) run(() => api(`/bouquets/${id}/cancel`, { method: 'POST' }), 'Букет скасовано');
                }}
              >
                Скасувати
              </Button>
            )}
            {isDraft && (
              <IconButton
                label="Видалити"
                tone="clay"
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Видалити чернетку?',
                    description: 'Чернетку буде видалено назавжди.',
                    confirmText: 'Видалити',
                    danger: true,
                  });
                  if (ok)
                    run(async () => {
                      await api(`/bouquets/${id}`, { method: 'DELETE' });
                      router.push('/bouquets');
                    });
                }}
              >
                <IconTrash width={18} height={18} />
              </IconButton>
            )}
          </div>
        </div>
      </div>

      {/* Mobile add widget */}
      {isDraft && (
        <div className="lg:hidden">
          <div
            className="relative overflow-hidden rounded-2xl p-4 text-white shadow-lift"
            style={{ background: 'linear-gradient(135deg, var(--color-bloom), var(--color-bloom-strong))' }}
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/[0.07]" />

            <div className="relative flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                <IconBouquet width={24} height={24} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-white/75">Зібрати букет</div>
                <div className="text-lg font-semibold leading-tight">
                  {detail.lines.length === 0
                    ? 'Поки порожній'
                    : `${detail.lines.length} ${pluralUk(detail.lines.length, 'позиція', 'позиції', 'позицій')}`}
                </div>
              </div>
              {detail.lines.length > 0 && (
                <div className="shrink-0 text-right">
                  <div className="text-[11px] font-medium text-white/70">Чистий</div>
                  <div className="nums text-base font-semibold">{formatUAH(net)}</div>
                </div>
              )}
            </div>

            <button
              onClick={() => setPickerOpen(true)}
              className="relative mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-[15px] font-semibold text-bloom-ink shadow-soft transition-transform active:translate-y-px"
            >
              <IconPlus width={20} height={20} /> Додати квіти
            </button>
            <div className="relative mt-2.5 flex items-center justify-center gap-4 text-xs font-medium text-white/75">
              <button
                onClick={() => setCustomOpen(true)}
                className="cursor-pointer transition-colors hover:text-white"
              >
                + Своя позиція
              </button>
              <span className="text-white/30">·</span>
              <button
                onClick={() => setExpensesOpen(true)}
                className="cursor-pointer transition-colors hover:text-white"
              >
                Інші витрати
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profit hero */}
      <Card className="overflow-hidden">
        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1fr]">
          <div className="bg-surface p-5">
            <div className="text-[13px] font-medium text-ink-soft">Брудний дохід</div>
            <div className="nums mt-2 text-3xl font-semibold text-bloom-ink">{formatUAH(revenue)}</div>
            <div className="mt-1 text-xs text-ink-faint">уся сума за букет</div>
          </div>
          <div className="bg-surface p-5">
            <div className="text-[13px] font-medium text-ink-soft">Чистий дохід</div>
            <div className={`nums mt-2 text-3xl font-semibold ${net >= 0 ? 'text-sage-ink' : 'text-clay-ink'}`}>
              {formatUAH(net)}
            </div>
            <div className="mt-1 text-xs text-ink-faint">маржа {formatBps(p?.marginBps)}</div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line sm:col-span-2 lg:col-span-1 lg:grid-cols-1">
            <div className="bg-surface p-5">
              <div className="text-xs font-medium text-ink-soft">Собівартість квітів</div>
              <div className="nums mt-1 text-lg font-semibold text-ink">{formatUAH(cost)}</div>
            </div>
            <div className="bg-surface p-5">
              <div className="text-xs font-medium text-ink-soft">Витрати по букету</div>
              <div className="nums mt-1 text-lg font-semibold text-ink">{formatUAH(bouqExp)}</div>
            </div>
          </div>
        </div>
        {/* composition bar */}
        {revenue > 0 && (
          <div className="border-t border-line px-5 py-4">
            <div className="flex h-3 overflow-hidden rounded-full bg-surface-sunk">
              <Seg value={cost} total={revenue} color="var(--color-clay)" />
              <Seg value={bouqExp} total={revenue} color="var(--color-gold)" />
              <Seg value={Math.max(0, net)} total={revenue} color="var(--color-sage)" />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-soft">
              <Legend color="var(--color-clay)" label="Собівартість" value={formatUAH(cost)} />
              <Legend color="var(--color-gold)" label="Витрати" value={formatUAH(bouqExp)} />
              <Legend color="var(--color-sage)" label="Навар (чистий)" value={formatUAH(net)} />
            </div>
          </div>
        )}
      </Card>

      {/* Lines */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Склад букета"
          right={<span className="text-xs text-ink-faint">{detail.lines.length} позицій</span>}
        />
        {detail.lines.length === 0 ? (
          <EmptyState
            icon={<IconBouquet width={26} height={26} />}
            title="Букет порожній"
            description={isDraft ? 'Додайте квіти з каталогу, щоб зібрати букет.' : 'У цьому букеті немає позицій.'}
            className="py-10"
            action={
              isDraft ? (
                <Button onClick={() => setPickerOpen(true)}>
                  <IconPlus width={18} height={18} /> Додати квіти
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-2.5">Позиція</th>
                  <th className="px-5 py-2.5 text-right">К-сть</th>
                  <th className="px-5 py-2.5 text-right">Закуп/од</th>
                  <th className="px-5 py-2.5 text-right">Продаж/од</th>
                  <th className="px-5 py-2.5 text-right">Собівартість</th>
                  <th className="px-5 py-2.5 text-right">Виручка</th>
                  <th className="px-5 py-2.5 text-right">Навар</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {detail.lines.map((l) => (
                  <tr key={l.id} className="group transition-colors hover:bg-surface-soft">
                    <td className="px-5 py-2.5">
                      <span className="font-medium text-ink">{l.itemNameSnapshot}</span>
                      <span className="ml-1.5 text-xs text-ink-faint">/ {UNIT_LABEL[l.unitSnapshot]}</span>
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      {isDraft ? (
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          defaultValue={l.quantity}
                          onBlur={(e) => {
                            const v = Number(e.target.value);
                            if (v > 0 && v !== l.quantity)
                              run(() =>
                                api(`/bouquets/${id}/lines/${l.id}`, { method: 'PATCH', body: { quantity: v } }),
                              );
                          }}
                          className="nums w-20 rounded-lg border border-line-strong bg-surface px-2 py-1 text-right text-sm outline-none focus:border-bloom focus:ring-4 focus:ring-bloom/12"
                        />
                      ) : (
                        <span className="nums">{l.quantity}</span>
                      )}
                    </td>
                    <td className="nums px-5 py-2.5 text-right text-ink-faint">{formatUAH(l.unitPurchasePriceKopiyky)}</td>
                    <td className="nums px-5 py-2.5 text-right text-ink-faint">{formatUAH(l.unitSalePriceKopiyky)}</td>
                    <td className="nums px-5 py-2.5 text-right text-ink-soft">{formatUAH(l.lineCostKopiyky)}</td>
                    <td className="nums px-5 py-2.5 text-right text-ink">{formatUAH(l.lineRevenueKopiyky)}</td>
                    <td className="nums px-5 py-2.5 text-right font-medium text-sage-ink">{formatUAH(l.lineMarginKopiyky)}</td>
                    <td className="px-5 py-2.5 text-right">
                      {isDraft && (
                        <IconButton
                          label="Прибрати"
                          tone="clay"
                          className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                          onClick={() => run(() => api(`/bouquets/${id}/lines/${l.id}`, { method: 'DELETE' }))}
                        >
                          <IconX width={16} height={16} />
                        </IconButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {expenses.length > 0 && (
                <tfoot>
                  <tr>
                    <td
                      colSpan={8}
                      className="border-t-2 border-line bg-surface-soft px-5 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-wide text-ink-faint"
                    >
                      Інші витрати{' '}
                      <span className="font-normal normal-case text-ink-faint/80">· окрім квітів</span>
                    </td>
                  </tr>
                  {expenses.map((e) => (
                    <tr key={e.id} className="bg-surface-soft">
                      <td colSpan={6} className="px-5 py-1.5">
                        <span className="text-ink">{EXPENSE_KIND_LABEL[e.kind]}</span>
                        {e.description && <span className="ml-1.5 text-ink-faint">· {e.description}</span>}
                      </td>
                      <td colSpan={2} className="nums px-5 py-1.5 text-right text-ink-soft">
                        {formatUAH(e.amountKopiyky)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-surface-soft">
                    <td colSpan={6} className="border-t border-line px-5 py-2.5 text-sm text-ink-soft">
                      Разом витрат
                    </td>
                    <td
                      colSpan={2}
                      className="nums border-t border-line px-5 py-2.5 text-right text-sm font-semibold text-ink"
                    >
                      {formatUAH(expensesTotal)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {isDraft && (
          <div className="hidden flex-wrap items-center gap-2 border-t border-line bg-surface-soft px-5 py-4 lg:flex">
            <Button onClick={() => setPickerOpen(true)} className="flex-1 sm:flex-none">
              <IconPlus width={18} height={18} /> Додати квіти
            </Button>
            <Button variant="secondary" onClick={() => setCustomOpen(true)}>
              Своя позиція
            </Button>
            <Button variant="ghost" onClick={() => setExpensesOpen(true)}>
              <IconWallet width={17} height={17} /> Інші витрати
            </Button>
          </div>
        )}
        {/* Confirmed bouquet can still get expenses; line editing is closed */}
        {isConfirmed && (
          <div className="flex border-t border-line bg-surface-soft px-5 py-4">
            <Button variant="secondary" onClick={() => setExpensesOpen(true)}>
              <IconWallet width={17} height={17} /> Інші витрати
            </Button>
          </div>
        )}
      </Card>

      {/* Sell modal */}
      <SellModal
        open={sellOpen}
        onClose={() => setSellOpen(false)}
        revenue={revenue}
        onSell={(soldOn, amountReceivedKopiyky) =>
          run(async () => {
            await api(`/bouquets/${id}/sell`, {
              method: 'POST',
              body: { soldOn, ...(amountReceivedKopiyky != null ? { amountReceivedKopiyky } : {}) },
            });
            setSellOpen(false);
          }, 'Букет продано')
        }
      />

      {/* Catalog picker */}
      <AddLinesModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        catalog={catalog}
        onConfirm={addLines}
        onCustom={() => {
          setPickerOpen(false);
          setCustomOpen(true);
        }}
      />

      {/* Custom line modal */}
      <CustomLineModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onAdd={(body) =>
          run(async () => {
            await api(`/bouquets/${id}/lines`, { method: 'POST', body });
            setCustomOpen(false);
          }, 'Позицію додано')
        }
      />

      {/* Other expenses modal */}
      <ExpensesModal
        open={expensesOpen}
        onClose={() => setExpensesOpen(false)}
        bouquetId={id}
        expenses={expenses}
        run={run}
        disabled={detail.status === 'CANCELLED'}
      />
    </div>
  );
}

function Seg({ value, total, color }: { value: number; total: number; color: string }) {
  const w = total > 0 ? (Math.max(0, value) / total) * 100 : 0;
  if (w <= 0) return null;
  return <div style={{ width: `${w}%`, background: color }} />;
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
      <span className="nums font-medium text-ink">{value}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * «Інші витрати» — add/list/delete bouquet expenses other than flowers.
 * The list also renders inline at the bottom of the «Склад букета» table.
 * ------------------------------------------------------------------ */
function ExpensesModal({
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
    }, 'Витрату додано');
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Інші витрати"
      description="Витрати по букету, окрім квітів — пакування, доставка, робота…"
      size="sm"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Готово
        </Button>
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
          <p className="text-sm text-ink-faint">Поки немає витрат по цьому букету.</p>
        )}

        {!disabled && (
          <div className="rounded-xl border border-line bg-surface-soft p-3">
            <div className="flex flex-wrap items-end gap-2.5">
              <Field label="Тип" className="w-32">
                <Select value={kind} onChange={setKind} options={EXPENSE_SELECT} ariaLabel="Тип витрати" />
              </Field>
              <Field label="Сума" className="w-24">
                <MoneyInput value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
              </Field>
              <Field label="Опис" className="min-w-[110px] flex-1">
                <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="стрічка…" />
              </Field>
              <Button variant="secondary" onClick={add} disabled={!amount}>
                <IconPlus width={17} height={17} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
function SellModal({
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

        <Alert tone="gold">Після продажу склад букета не можна змінити. Щоб переробити — «Клонувати» в нову чернетку.</Alert>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
function CustomLineModal({
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

  useEffect(() => {
    if (open) {
      setName('');
      setPurchase('');
      setSale('');
      setQuantity('1');
    }
  }, [open]);

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

/* ------------------------------------------------------------------ *
 * Catalog picker — touch-friendly batch add with quantity steppers
 * ------------------------------------------------------------------ */
function AddLinesModal({
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
