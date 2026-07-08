// Today's business date in Europe/Kyiv as YYYY-MM-DD (en-CA renders ISO order).
// Monthly reports are timezone-independent, so we pin the shop's local day.
export function todayKyiv(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv' }).format(new Date());
}
