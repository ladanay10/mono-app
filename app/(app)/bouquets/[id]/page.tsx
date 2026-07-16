"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatBps, formatUAH } from "@/lib/money";
import { EXPENSE_KIND_LABEL, UNIT_LABEL } from "@/lib/labels";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  IconButton,
  Spinner,
  StatusBadge,
} from "@/components/ui";
import { useConfirm } from "@/components/modal";
import {
  IconBouquet,
  IconChevronLeft,
  IconCopy,
  IconPlus,
  IconSparkle,
  IconTrash,
  IconWallet,
  IconX,
} from "@/components/icons";
import { AddLinesModal } from "./_components/add-lines-modal";
import { CustomLineModal } from "./_components/custom-line-modal";
import { ExpensesModal } from "./_components/expenses-modal";
import { SaveTemplateModal } from "./_components/save-template-modal";
import { SellModal } from "./_components/sell-modal";
import { pluralUk } from "@/lib/plural";
import { useBouquetDetail } from "@/lib/hooks/use-bouquet-detail";

export default function BouquetPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const confirm = useConfirm();

  const { detail, catalog, expenses, loading, run } = useBouquetDetail(id);

  const [sellOpen, setSellOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

  if (loading || !detail) return <Spinner label="Відкриваємо букет…" />;

  const isDraft = detail.status === "DRAFT";
  const isConfirmed = detail.status === "CONFIRMED";
  const canEditHeader = isDraft || isConfirmed;
  const p = detail.profit;
  const expensesTotal = expenses.reduce((s, e) => s + e.amountKopiyky, 0);

  async function addLines(
    selections: { catalogItemId: string; quantity: number }[],
  ) {
    if (selections.length === 0) return;
    await run(async () => {
      for (const s of selections) {
        await api(`/bouquets/${id}/lines`, {
          method: "POST",
          body: { catalogItemId: s.catalogItemId, quantity: s.quantity },
        });
      }
      setPickerOpen(false);
    }, `Додано позицій: ${selections.length}`);
  }

  async function saveTitle(next: string) {
    if ((detail!.title ?? "") === next.trim() || !canEditHeader) return;
    await run(() =>
      api(`/bouquets/${id}`, {
        method: "PATCH",
        body: { title: next.trim() || null },
      }),
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

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            {canEditHeader ? (
              <input
                // Uncontrolled: remounts when the persisted title changes (reload).
                key={detail.title ?? ""}
                defaultValue={detail.title ?? ""}
                onBlur={(e) => saveTitle(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.target as HTMLInputElement).blur()
                }
                placeholder="Назва букета…"
                aria-label="Назва букета"
                className="w-full max-w-lg rounded-xl border border-line bg-surface/60 px-3 py-2 font-display text-2xl font-semibold text-ink outline-none transition-[border-color,background,box-shadow] placeholder:font-normal placeholder:text-ink-faint focus:border-line-strong focus:bg-surface sm:-ml-3 sm:border-transparent sm:bg-transparent sm:text-3xl sm:hover:border-line sm:hover:bg-surface/60"
              />
            ) : (
              <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                {detail.title || "Без назви"}
              </h1>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <StatusBadge status={detail.status} />
              <span className="text-xs text-ink-faint">
                Створено{" "}
                {new Date(detail.createdAt).toLocaleDateString("uk-UA")}
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
                run(
                  async () => {
                    const c = await api<{ id: string }>(
                      `/bouquets/${id}/clone`,
                      { method: "POST" },
                    );
                    router.push(`/bouquets/${c.id}`);
                  },
                  undefined,
                  { reload: false },
                )
              }
            >
              <IconCopy width={17} height={17} /> Клонувати
            </Button>
            {detail.lines.length > 0 && (
              <Button variant="ghost" onClick={() => setSaveTemplateOpen(true)}>
                <IconSparkle width={17} height={17} /> Шаблон
              </Button>
            )}
            {isConfirmed && (
              <Button
                variant="ghost"
                onClick={async () => {
                  const ok = await confirm({
                    title: "Скасувати букет?",
                    description:
                      "Букет позначиться як скасований. Це не видалення — історія збережеться.",
                    confirmText: "Скасувати букет",
                    cancelText: "Ні",
                    danger: true,
                  });
                  if (ok)
                    run(
                      () => api(`/bouquets/${id}/cancel`, { method: "POST" }),
                      "Букет скасовано",
                    );
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
                    title: "Видалити чернетку?",
                    description: "Чернетку буде видалено назавжди.",
                    confirmText: "Видалити",
                    danger: true,
                  });
                  if (ok)
                    run(
                      async () => {
                        await api(`/bouquets/${id}`, { method: "DELETE" });
                        router.push("/bouquets");
                      },
                      "Чернетку видалено",
                      { reload: false },
                    );
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
            style={{
              background: "linear-gradient(135deg, #1c1f2a, #12141b)",
            }}
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-12 -left-6 h-28 w-28 rounded-full bg-white/[0.07]" />

            <div className="relative flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                <IconBouquet width={24} height={24} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-white/75">
                  Зібрати букет
                </div>
                <div className="text-lg font-semibold leading-tight">
                  {detail.lines.length === 0
                    ? "Поки порожній"
                    : `${detail.lines.length} ${pluralUk(detail.lines.length, "позиція", "позиції", "позицій")}`}
                </div>
              </div>
              {detail.lines.length > 0 && (
                <div className="shrink-0 text-right">
                  <div className="text-[11px] font-medium text-white/70">
                    Чистий
                  </div>
                  <div className="nums text-base font-semibold">
                    {formatUAH(net)}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setPickerOpen(true)}
              className="relative mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white text-[15px] font-semibold text-canvas shadow-soft transition-transform active:translate-y-px"
            >
              <IconPlus width={20} height={20} /> Додати квіти
            </button>
            <div className="relative mt-2.5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setCustomOpen(true)}
                className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white/15 text-sm font-medium text-white backdrop-blur transition-colors active:bg-white/25"
              >
                <IconPlus width={16} height={16} /> Своя позиція
              </button>
              <button
                onClick={() => setExpensesOpen(true)}
                className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white/15 text-sm font-medium text-white backdrop-blur transition-colors active:bg-white/25"
              >
                <IconWallet width={16} height={16} /> Інше
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profit hero */}
      <Card className="overflow-hidden">
        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_1fr]">
          <div className="bg-surface p-5">
            <div className="text-[13px] font-medium text-ink-soft">
              Брудний дохід
            </div>
            <div className="nums mt-2 text-3xl font-semibold text-bloom-ink">
              {formatUAH(revenue)}
            </div>
            <div className="mt-1 text-xs text-ink-faint">уся сума за букет</div>
          </div>
          <div className="bg-surface p-5">
            <div className="text-[13px] font-medium text-ink-soft">
              Чистий дохід
            </div>
            <div
              className={`nums mt-2 text-3xl font-semibold ${net >= 0 ? "text-sage-ink" : "text-clay-ink"}`}
            >
              {formatUAH(net)}
            </div>
            <div className="mt-1 text-xs text-ink-faint">
              маржа {formatBps(p?.marginBps)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line sm:col-span-2 lg:col-span-1 lg:grid-cols-1">
            <div className="bg-surface p-5">
              <div className="text-xs font-medium text-ink-soft">
                Собівартість квітів
              </div>
              <div className="nums mt-1 text-lg font-semibold text-ink">
                {formatUAH(cost)}
              </div>
            </div>
            <div className="bg-surface p-5">
              <div className="text-xs font-medium text-ink-soft">
                Інше (пакування)
              </div>
              <div className="nums mt-1 text-lg font-semibold text-sage-ink">
                {formatUAH(bouqExp)}
              </div>
              <div className="mt-0.5 text-[11px] text-ink-faint">
                у наварі · 100%
              </div>
            </div>
          </div>
        </div>
        {/* composition bar — packaging add-on is inside «навар» now */}
        {revenue > 0 && (
          <div className="border-t border-line px-5 py-4">
            <div className="flex h-3 overflow-hidden rounded-full bg-surface-sunk">
              <Seg value={cost} total={revenue} color="var(--color-clay)" />
              <Seg
                value={Math.max(0, net)}
                total={revenue}
                color="var(--color-sage)"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-soft">
              <Legend
                color="var(--color-clay)"
                label="Собівартість"
                value={formatUAH(cost)}
              />
              <Legend
                color="var(--color-sage)"
                label="Навар (чистий)"
                value={formatUAH(net)}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Lines */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Склад букета"
          right={
            <span className="text-xs text-ink-faint">
              {detail.lines.length} позицій
            </span>
          }
        />
        {detail.lines.length === 0 ? (
          <EmptyState
            icon={<IconBouquet width={26} height={26} />}
            title="Букет порожній"
            description={
              isDraft
                ? "Додайте квіти з каталогу, щоб зібрати букет."
                : "У цьому букеті немає позицій."
            }
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
          <>
            {/* Mobile: line cards (no horizontal scroll) */}
            <div className="lg:hidden">
              <ul className="divide-y divide-line">
                {detail.lines.map((l) => (
                  <li key={l.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-ink">
                          {l.itemNameSnapshot}
                        </span>
                        <span className="ml-1 text-xs text-ink-faint">
                          / {UNIT_LABEL[l.unitSnapshot]}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {isDraft ? (
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            defaultValue={l.quantity}
                            aria-label="Кількість"
                            onBlur={(e) => {
                              const v = Number(e.target.value);
                              if (v > 0 && v !== l.quantity)
                                run(() =>
                                  api(`/bouquets/${id}/lines/${l.id}`, {
                                    method: "PATCH",
                                    body: { quantity: v },
                                  }),
                                );
                            }}
                            inputMode="decimal"
                            className="nums w-16 rounded-lg border border-line bg-surface px-2 py-1.5 text-right text-base outline-none focus:border-bloom sm:text-sm"
                          />
                        ) : (
                          <span className="nums text-sm text-ink-soft">
                            ×{l.quantity}
                          </span>
                        )}
                        {isDraft && (
                          <IconButton
                            label="Прибрати"
                            tone="clay"
                            onClick={() =>
                              run(() =>
                                api(`/bouquets/${id}/lines/${l.id}`, {
                                  method: "DELETE",
                                }),
                              )
                            }
                          >
                            <IconX width={16} height={16} />
                          </IconButton>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-faint">
                      <span>
                        Собів.{" "}
                        <span className="nums text-ink-soft">
                          {formatUAH(l.lineCostKopiyky)}
                        </span>
                      </span>
                      <span>
                        Виручка{" "}
                        <span className="nums text-ink">
                          {formatUAH(l.lineRevenueKopiyky)}
                        </span>
                      </span>
                      <span>
                        Навар{" "}
                        <span className="nums font-medium text-sage-ink">
                          {formatUAH(l.lineMarginKopiyky)}
                        </span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              {expenses.length > 0 && (
                <div className="border-t-2 border-line bg-surface-soft">
                  <div className="px-4 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    Інше{" "}
                    <span className="font-normal normal-case text-ink-faint/80">
                      · 100% навар
                    </span>
                  </div>
                  <ul>
                    {expenses.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between gap-3 px-4 py-1.5 text-sm"
                      >
                        <span className="min-w-0 truncate">
                          <span className="text-ink">
                            {EXPENSE_KIND_LABEL[e.kind]}
                          </span>
                          {e.description && (
                            <span className="ml-1.5 text-ink-faint">
                              · {e.description}
                            </span>
                          )}
                        </span>
                        <span className="nums shrink-0 text-ink-soft">
                          {formatUAH(e.amountKopiyky)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-1 flex items-center justify-between border-t border-line px-4 py-2.5 text-sm">
                    <span className="text-ink-soft">Разом</span>
                    <span className="nums font-semibold text-ink">
                      {formatUAH(expensesTotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop: full table */}
            <div className="hidden overflow-x-auto lg:block">
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
                    <tr
                      key={l.id}
                      className="group transition-colors hover:bg-surface-soft"
                    >
                      <td className="px-5 py-2.5">
                        <span className="font-medium text-ink">
                          {l.itemNameSnapshot}
                        </span>
                        <span className="ml-1.5 text-xs text-ink-faint">
                          / {UNIT_LABEL[l.unitSnapshot]}
                        </span>
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
                                  api(`/bouquets/${id}/lines/${l.id}`, {
                                    method: "PATCH",
                                    body: { quantity: v },
                                  }),
                                );
                            }}
                            className="nums w-20 rounded-lg border border-line bg-surface px-2 py-1 text-right text-sm outline-none focus:border-bloom"
                          />
                        ) : (
                          <span className="nums">{l.quantity}</span>
                        )}
                      </td>
                      <td className="nums px-5 py-2.5 text-right text-ink-faint">
                        {formatUAH(l.unitPurchasePriceKopiyky)}
                      </td>
                      <td className="nums px-5 py-2.5 text-right text-ink-faint">
                        {formatUAH(l.unitSalePriceKopiyky)}
                      </td>
                      <td className="nums px-5 py-2.5 text-right text-ink-soft">
                        {formatUAH(l.lineCostKopiyky)}
                      </td>
                      <td className="nums px-5 py-2.5 text-right text-ink">
                        {formatUAH(l.lineRevenueKopiyky)}
                      </td>
                      <td className="nums px-5 py-2.5 text-right font-medium text-sage-ink">
                        {formatUAH(l.lineMarginKopiyky)}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {isDraft && (
                          <IconButton
                            label="Прибрати"
                            tone="clay"
                            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                            onClick={() =>
                              run(() =>
                                api(`/bouquets/${id}/lines/${l.id}`, {
                                  method: "DELETE",
                                }),
                              )
                            }
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
                        Інше{" "}
                        <span className="font-normal normal-case text-ink-faint/80">
                          · пакування тощо · 100% навар
                        </span>
                      </td>
                    </tr>
                    {expenses.map((e) => (
                      <tr key={e.id} className="bg-surface-soft">
                        <td colSpan={6} className="px-5 py-1.5">
                          <span className="text-ink">
                            {EXPENSE_KIND_LABEL[e.kind]}
                          </span>
                          {e.description && (
                            <span className="ml-1.5 text-ink-faint">
                              · {e.description}
                            </span>
                          )}
                        </td>
                        <td
                          colSpan={2}
                          className="nums px-5 py-1.5 text-right text-ink-soft"
                        >
                          {formatUAH(e.amountKopiyky)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-surface-soft">
                      <td
                        colSpan={6}
                        className="border-t border-line px-5 py-2.5 text-sm text-ink-soft"
                      >
                        Разом
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
          </>
        )}

        {isDraft && (
          <div className="hidden flex-wrap items-center gap-2 border-t border-line bg-surface-soft px-5 py-4 lg:flex">
            <Button
              onClick={() => setPickerOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <IconPlus width={18} height={18} /> Додати квіти
            </Button>
            <Button variant="secondary" onClick={() => setCustomOpen(true)}>
              Своя позиція
            </Button>
            <Button variant="ghost" onClick={() => setExpensesOpen(true)}>
              <IconWallet width={17} height={17} /> Інше
            </Button>
          </div>
        )}
        {/* Confirmed bouquet can still get expenses; line editing is closed */}
        {isConfirmed && (
          <div className="flex border-t border-line bg-surface-soft px-5 py-4">
            <Button variant="secondary" onClick={() => setExpensesOpen(true)}>
              <IconWallet width={17} height={17} /> Інше
            </Button>
          </div>
        )}
      </Card>

      {/* Sell modal */}
      <SellModal
        key={sellOpen ? "open" : "closed"}
        open={sellOpen}
        onClose={() => setSellOpen(false)}
        revenue={revenue}
        defaultTitle={detail.title ?? ""}
        onSell={(soldOn, amountReceivedKopiyky, name) =>
          run(async () => {
            // Save an entered/edited name first, then sell.
            if ((detail.title ?? "") !== name.trim()) {
              await api(`/bouquets/${id}`, {
                method: "PATCH",
                body: { title: name.trim() || null },
              });
            }
            await api(`/bouquets/${id}/sell`, {
              method: "POST",
              body: {
                soldOn,
                ...(amountReceivedKopiyky != null
                  ? { amountReceivedKopiyky }
                  : {}),
              },
            });
            setSellOpen(false);
          }, "Букет продано")
        }
      />

      {/* Catalog picker */}
      <AddLinesModal
        key={pickerOpen ? "open" : "closed"}
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
        key={customOpen ? "open" : "closed"}
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onAdd={(body) =>
          run(async () => {
            await api(`/bouquets/${id}/lines`, { method: "POST", body });
            setCustomOpen(false);
          }, "Позицію додано")
        }
      />

      {/* Other expenses modal */}
      <ExpensesModal
        open={expensesOpen}
        onClose={() => setExpensesOpen(false)}
        bouquetId={id}
        expenses={expenses}
        run={run}
        disabled={detail.status === "CANCELLED"}
      />

      {/* Save as template */}
      <SaveTemplateModal
        key={saveTemplateOpen ? "open" : "closed"}
        open={saveTemplateOpen}
        onClose={() => setSaveTemplateOpen(false)}
        defaultName={detail.title || ""}
        onSave={(name) =>
          run(async () => {
            await api("/recipes/from-bouquet", {
              method: "POST",
              body: { bouquetId: id, name },
            });
            setSaveTemplateOpen(false);
          }, "Шаблон збережено")
        }
      />
    </div>
  );
}

function Seg({
  value,
  total,
  color,
}: {
  value: number;
  total: number;
  color: string;
}) {
  const w = total > 0 ? (Math.max(0, value) / total) * 100 : 0;
  if (w <= 0) return null;
  return <div style={{ width: `${w}%`, background: color }} />;
}

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
      <span className="nums font-medium text-ink">{value}</span>
    </span>
  );
}
