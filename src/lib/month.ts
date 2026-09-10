export type YearMonth = { year: number; month: number };

export function parseMonth(value: string | undefined): YearMonth {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    if (month >= 1 && month <= 12) return { year, month };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function monthKey({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (((total % 12) + 12) % 12) + 1 };
}

export function daysInMonth({ year, month }: YearMonth): number {
  return new Date(year, month, 0).getDate();
}

export function monthRange({ year, month }: YearMonth): { from: string; to: string } {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const to = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth({ year, month })).padStart(2, "0")}`;
  return { from, to };
}

export function compareYearMonth(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

export function monthLabel({ year, month }: YearMonth, locale: string, style: "short" | "long" = "long"): string {
  return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: style, year: "numeric" });
}

// dateStr is a plain "YYYY-MM-DD" string with no time component — parsed via the Date(y, m, d)
// constructor (local time) rather than new Date(dateStr) (parsed as UTC midnight), since the
// latter can roll back a day once formatted in a timezone behind UTC.
export function formatDate(dateStr: string, locale: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(locale);
}

export function yearRange(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export function monthHref(target: YearMonth, category: string, sort: string): string {
  const params = new URLSearchParams();
  params.set("month", monthKey(target));
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);
  return `/dashboard?${params.toString()}`;
}
