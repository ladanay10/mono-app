export const CATALOG_KINDS = ['FLOWER', 'GREENERY', 'MATERIAL', 'PACKAGING'] as const;
// Single unit for the whole app: PIECE (шт). Kept as an array so the type still
// derives cleanly, but there is only one value — no unit picker in the UI.
export const UNITS = ['PIECE'] as const;
export const EXPENSE_KINDS = [
  'PACKAGING',
  'DELIVERY',
  'LABOR',
  'RENT',
  'UTILITIES',
  'MARKETING',
  'TAX',
  'OVERHEAD',
  'OTHER',
] as const;
export const BOUQUET_STATUSES = ['DRAFT', 'CONFIRMED', 'SOLD', 'CANCELLED'] as const;

export type CatalogKind = (typeof CATALOG_KINDS)[number];
export type Unit = (typeof UNITS)[number];
export type ExpenseKind = (typeof EXPENSE_KINDS)[number];
export type BouquetStatus = (typeof BOUQUET_STATUSES)[number];

export interface CatalogItem {
  id: string;
  name: string;
  kind: CatalogKind;
  category: string | null;
  unit: Unit;
  purchasePriceKopiyky: number;
  salePriceKopiyky: number;
  supplierName: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface BouquetProfit {
  bouquetId: string;
  linesSaleTotalKopiyky: number;
  flowersCostKopiyky: number;
  bouquetExpensesKopiyky: number;
  revenueKopiyky: number;
  grossMarginKopiyky: number;
  netProfitKopiyky: number;
  marginBps: number | null;
}

export interface BouquetLine {
  id: string;
  catalogItemId: string | null;
  itemNameSnapshot: string;
  unitSnapshot: Unit;
  quantity: number;
  unitPurchasePriceKopiyky: number;
  unitSalePriceKopiyky: number;
  lineCostKopiyky: number;
  lineRevenueKopiyky: number;
  lineMarginKopiyky: number;
}

export interface Bouquet {
  id: string;
  title: string | null;
  status: BouquetStatus;
  salePriceKopiyky: number | null;
  discountKopiyky: number;
  amountReceivedKopiyky: number;
  soldOn: string | null;
  createdAt: string;
}

export interface BouquetListItem extends Bouquet {
  profit: BouquetProfit | null;
}

export interface BouquetDetail extends Bouquet {
  lines: BouquetLine[];
  profit: BouquetProfit | null;
}

export interface Expense {
  id: string;
  scope: 'BOUQUET' | 'GENERAL';
  bouquetId: string | null;
  kind: ExpenseKind;
  description: string | null;
  amountKopiyky: number;
  incurredOn: string;
}

export interface RecipeLine {
  id: string;
  catalogItemId: string | null;
  itemNameSnapshot: string;
  unitSnapshot: Unit;
  quantity: string; // numeric from the API
  unitPurchasePriceKopiyky: number;
  unitSalePriceKopiyky: number;
}

export interface Recipe {
  id: string;
  name: string;
  notes: string | null;
  createdAt: string;
  lines: RecipeLine[];
}

export interface ReportSummary {
  from: string;
  to: string;
  soldCount: number;
  grossRevenueKopiyky: number;
  flowersCostKopiyky: number;
  bouquetExpensesKopiyky: number;
  generalExpensesKopiyky: number;
  netProfitKopiyky: number;
  cashReceivedKopiyky: number;
}

export interface MonthlyRow {
  month: string;
  soldCount: number;
  grossRevenueKopiyky: number;
  flowersCostKopiyky: number;
  bouquetExpensesKopiyky: number;
  generalExpensesKopiyky: number;
  netProfitKopiyky: number;
}

export interface TopFlower {
  catalogItemId: string | null;
  name: string;
  unit: Unit;
  totalQuantity: number;
  timesUsed: number;
  totalCostKopiyky: number;
  totalRevenueKopiyky: number;
  totalMarginKopiyky: number;
}

export interface Outstanding {
  count: number;
  outstandingKopiyky: number;
  bouquets: Array<{
    id: string;
    title: string | null;
    soldOn: string | null;
    salePriceKopiyky: number;
    discountKopiyky: number;
    amountReceivedKopiyky: number;
    owedKopiyky: number;
  }>;
}
