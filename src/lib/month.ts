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

export function monthLabel({ year, month }: YearMonth, style: "short" | "long" = "long"): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: style, year: "numeric" });
}
