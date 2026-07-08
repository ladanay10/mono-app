'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { formatUAH, kopiykyToUah, uahToKopiyky } from '@/lib/money';
import { CATALOG_KINDS, type CatalogItem, type CatalogKind, type Unit } from '@/lib/types';
import { KIND_LABEL, UNIT_LABEL, type Tone } from '@/lib/labels';
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
  Spinner,
} from '@/components/ui';
import { Select, type SelectOption } from '@/components/select';
import { Modal, useConfirm } from '@/components/modal';
import { useToast } from '@/components/toast';
import {
  IconBox,
  IconBouquet,
  IconCatalog,
  IconEdit,
  IconLeaf,
  IconPlus,
  IconSearch,
  IconTag,
  IconArchive,
} from '@/components/icons';

const KIND_ICON: Record<CatalogKind, React.ReactNode> = {
  FLOWER: <IconBouquet width={16} height={16} />,
  GREENERY: <IconLeaf width={16} height={16} />,
  MATERIAL: <IconTag width={16} height={16} />,
  PACKAGING: <IconBox width={16} height={16} />,
};

const KIND_TONE: Record<CatalogKind, Tone> = {
  FLOWER: 'bloom',
  GREENERY: 'sage',
  MATERIAL: 'gold',
  PACKAGING: 'ink',
};

const KIND_SELECT: SelectOption<CatalogKind>[] = CATALOG_KINDS.map((k) => ({
  value: k,
  label: KIND_LABEL[k],
  icon: KIND_ICON[k],
}));

const emptyForm = {
  name: '',
  kind: 'FLOWER' as CatalogKind,
  unit: 'PIECE' as Unit,
  category: '',
  supplierName: '',
  purchaseUah: '',
  saleUah: '',
};

type FilterKind = CatalogKind | 'ALL';

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterKind, setFilterKind] = useState<FilterKind>('ALL');

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();

  async function load() {
    setItems(await api<CatalogItem[]>('/catalog'));
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (filterKind !== 'ALL' && it.kind !== filterKind) return false;
      if (q && !(it.name.toLowerCase().includes(q) || it.category?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, query, filterKind]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setOpen(true);
  }

  function openEdit(it: CatalogItem) {
    setEditingId(it.id);
    setForm({
      name: it.name,
      kind: it.kind,
      unit: it.unit,
      category: it.category ?? '',
      supplierName: it.supplierName ?? '',
      purchaseUah: String(kopiykyToUah(it.purchasePriceKopiyky)),
      saleUah: String(kopiykyToUah(it.salePriceKopiyky)),
    });
    setError('');
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const body = {
      name: form.name,
      kind: form.kind,
      unit: form.unit,
      category: form.category || undefined,
      supplierName: form.supplierName || undefined,
      purchasePriceKopiyky: uahToKopiyky(form.purchaseUah),
      salePriceKopiyky: uahToKopiyky(form.saleUah),
    };
    try {
      if (editingId) await api(`/catalog/${editingId}`, { method: 'PATCH', body });
      else await api('/catalog', { method: 'POST', body });
      setOpen(false);
      toast.success(editingId ? 'Позицію оновлено' : 'Позицію додано', form.name);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  }

  async function archive(it: CatalogItem) {
    const ok = await confirm({
      title: 'Архівувати позицію?',
      description: `«${it.name}» зникне зі списку. Минулі букети не зміняться — ціни в них зафіксовані.`,
      confirmText: 'Архівувати',
      danger: true,
    });
    if (!ok) return;
    await api(`/catalog/${it.id}`, { method: 'DELETE' });
    toast.success('Позицію заархівовано');
    await load();
  }

  const purchase = uahToKopiyky(form.purchaseUah);
  const sale = uahToKopiyky(form.saleUah);
  const marginK = sale - purchase;
  const marginPct = sale > 0 ? (marginK / sale) * 100 : 0;

  if (loading) return <Spinner label="Завантажуємо каталог…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Каталог"
        subtitle="Квіти й матеріали з двома цінами — закупівельною та продажною"
        actions={
          <Button onClick={openCreate}>
            <IconPlus width={18} height={18} /> Додати позицію
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <IconSearch width={18} height={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input
            placeholder="Пошук за назвою або категорією…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11"
          />
        </div>
        <Select
          value={filterKind}
          onChange={setFilterKind}
          options={[
            { value: 'ALL', label: 'Усі типи' },
            ...CATALOG_KINDS.map((k) => ({ value: k, label: KIND_LABEL[k], icon: KIND_ICON[k] })),
          ]}
          ariaLabel="Тип"
          className="w-full sm:w-52"
        />
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<IconCatalog width={26} height={26} />}
            title={items.length === 0 ? 'Каталог порожній' : 'Нічого не знайдено'}
            description={
              items.length === 0
                ? 'Додайте першу квітку або матеріал, щоб складати з них букети.'
                : 'Спробуйте змінити пошук або фільтр типу.'
            }
            action={
              items.length === 0 ? (
                <Button onClick={openCreate}>
                  <IconPlus width={18} height={18} /> Додати позицію
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3">Назва</th>
                  <th className="px-5 py-3">Тип</th>
                  <th className="px-5 py-3 text-right">Закупівельна</th>
                  <th className="px-5 py-3 text-right">Продажна</th>
                  <th className="px-5 py-3 text-right">Навар / од.</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((it) => {
                  const margin = it.salePriceKopiyky - it.purchasePriceKopiyky;
                  const pct = it.salePriceKopiyky > 0 ? Math.round((margin / it.salePriceKopiyky) * 100) : 0;
                  return (
                    <tr key={it.id} className="group transition-colors hover:bg-surface-soft">
                      <td className="px-5 py-3">
                        <div className="font-medium text-ink">{it.name}</div>
                        {it.category && <div className="text-xs text-ink-faint">{it.category}</div>}
                      </td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2">
                          <Badge tone={KIND_TONE[it.kind]}>{KIND_LABEL[it.kind]}</Badge>
                          <span className="text-xs text-ink-faint">/ {UNIT_LABEL[it.unit]}</span>
                        </span>
                      </td>
                      <td className="nums px-5 py-3 text-right text-ink-soft">{formatUAH(it.purchasePriceKopiyky)}</td>
                      <td className="nums px-5 py-3 text-right font-medium text-ink">{formatUAH(it.salePriceKopiyky)}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="nums font-medium text-sage-ink">{formatUAH(margin)}</div>
                        <div className="text-xs text-ink-faint">{pct}%</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1 opacity-100 transition-opacity lg:opacity-60 lg:group-hover:opacity-100">
                          <IconButton label="Редагувати" tone="bloom" onClick={() => openEdit(it)}>
                            <IconEdit width={17} height={17} />
                          </IconButton>
                          <IconButton label="Архівувати" tone="clay" onClick={() => archive(it)}>
                            <IconArchive width={17} height={17} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / edit modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? 'Редагувати позицію' : 'Нова позиція'}
        description="Ціни задаються тут і підтягуються в букети автоматично."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Скасувати
            </Button>
            <Button form="catalog-form" type="submit" disabled={saving}>
              {saving ? 'Збереження…' : editingId ? 'Зберегти' : 'Додати'}
            </Button>
          </>
        }
      >
        <form id="catalog-form" onSubmit={submit} className="space-y-4">
          <Field label="Назва">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Троянда Freedom"
              required
              autoFocus
            />
          </Field>
          <Field label="Тип">
            <Select
              value={form.kind}
              onChange={(kind) => setForm({ ...form, kind })}
              options={KIND_SELECT}
              ariaLabel="Тип"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Закупівельна">
              <MoneyInput
                value={form.purchaseUah}
                onChange={(e) => setForm({ ...form, purchaseUah: e.target.value })}
                placeholder="0"
                required
              />
            </Field>
            <Field label="Продажна">
              <MoneyInput
                value={form.saleUah}
                onChange={(e) => setForm({ ...form, saleUah: e.target.value })}
                placeholder="0"
                required
              />
            </Field>
          </div>

          {(form.purchaseUah || form.saleUah) && (
            <div className="flex items-center justify-between rounded-xl bg-sage-tint px-4 py-2.5 text-sm">
              <span className="text-sage-ink">Навар з одиниці</span>
              <span className="nums font-semibold text-sage-ink">
                {formatUAH(marginK)} · {marginPct.toFixed(0)}%
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Категорія" hint="необов’язково">
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Троянди"
              />
            </Field>
            <Field label="Постачальник" hint="необов’язково">
              <Input
                value={form.supplierName}
                onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
              />
            </Field>
          </div>

          {error && <div className="rounded-xl bg-clay-tint px-3.5 py-2.5 text-sm text-clay-ink">{error}</div>}
        </form>
      </Modal>
    </div>
  );
}
