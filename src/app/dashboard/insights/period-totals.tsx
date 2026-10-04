import { getTranslations, getLocale } from "next-intl/server";
import { formatMoney } from "@/lib/currency";

export async function PeriodTotals({ income, expenses, currency }: { income: number; expenses: number; currency: string }) {
  const [t, locale] = await Promise.all([getTranslations("dashboard.summary"), getLocale()]);
  const net = income - expenses;
  const rows = [
    { label: t("income"), value: income, className: "text-fg" },
    { label: t("expenses"), value: expenses, className: "text-fg" },
    { label: t("net"), value: net, className: net < 0 ? "text-danger" : "text-success" },
  ];

  return (
    <div className="mb-3 grid grid-cols-3 gap-2 rounded-xl border border-border bg-surface/30 p-3">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0">
          <p className="text-xs text-fg-muted">{row.label}</p>
          <p className={`truncate text-sm font-medium ${row.className}`}>{formatMoney(row.value, currency, locale)}</p>
        </div>
      ))}
    </div>
  );
}
