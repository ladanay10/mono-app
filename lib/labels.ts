// Ukrainian labels for the canonical UPPER_SNAKE enums, shared across pages
// and the custom selects. One source of truth for how an enum reads in the UI.

import type { BouquetStatus, CatalogKind, ExpenseKind, Unit } from '@/lib/types';

export const KIND_LABEL: Record<CatalogKind, string> = {
  FLOWER: 'Квіти',
  GREENERY: 'Зелень',
  MATERIAL: 'Матеріали',
  PACKAGING: 'Пакування',
};

export const UNIT_LABEL: Record<Unit, string> = {
  PIECE: 'шт',
};

export const EXPENSE_KIND_LABEL: Record<ExpenseKind, string> = {
  PACKAGING: 'Пакування',
  DELIVERY: 'Доставка',
  LABOR: 'Робота',
  RENT: 'Оренда',
  UTILITIES: 'Комуналка',
  MARKETING: 'Реклама',
  TAX: 'Податки',
  OVERHEAD: 'Накладні',
  OTHER: 'Інше',
};

export const STATUS_LABEL: Record<BouquetStatus, string> = {
  DRAFT: 'Чернетка',
  CONFIRMED: 'Підтверджено',
  SOLD: 'Продано',
  CANCELLED: 'Скасовано',
};

export type Tone = 'ink' | 'bloom' | 'sage' | 'clay' | 'gold';

export const STATUS_TONE: Record<BouquetStatus, Tone> = {
  DRAFT: 'ink',
  CONFIRMED: 'gold',
  SOLD: 'sage',
  CANCELLED: 'clay',
};
