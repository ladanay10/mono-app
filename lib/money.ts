// All API money is integer kopiyky (1 UAH = 100).

export function kopiykyToUah(kopiyky: number): number {
  return kopiyky / 100;
}

export function formatUAH(kopiyky: number | null | undefined): string {
  const value = kopiykyToUah(kopiyky ?? 0);
  return `${value.toLocaleString('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₴`;
}

// Parse a UAH string from an input (e.g. "60" or "60.50") into integer kopiyky.
export function uahToKopiyky(uah: string | number): number {
  const n = typeof uah === 'number' ? uah : parseFloat(String(uah).replace(',', '.'));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function formatBps(bps: number | null | undefined): string {
  if (bps == null) return '—';
  return `${(bps / 100).toFixed(1)}%`;
}

// Compact hryvnia for axis labels / tight chips: "1,2 тис ₴", "575 ₴".
export function formatUahCompact(kopiyky: number | null | undefined): string {
  const uah = kopiykyToUah(kopiyky ?? 0);
  const abs = Math.abs(uah);
  if (abs >= 1_000_000) return `${(uah / 1_000_000).toLocaleString('uk-UA', { maximumFractionDigits: 1 })} млн ₴`;
  if (abs >= 1_000) return `${(uah / 1_000).toLocaleString('uk-UA', { maximumFractionDigits: 1 })} тис ₴`;
  return `${Math.round(uah).toLocaleString('uk-UA')} ₴`;
}
