// Ukrainian plural picker: chooses one/few/many by the last digits of n.
// e.g. pluralUk(n, 'позиція', 'позиції', 'позицій').
export function pluralUk(n: number, one: string, few: string, many: string): string {
  const d = Math.abs(n) % 100;
  const d1 = d % 10;
  if (d > 10 && d < 20) return many;
  if (d1 === 1) return one;
  if (d1 >= 2 && d1 <= 4) return few;
  return many;
}
