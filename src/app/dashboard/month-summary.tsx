import { getTranslations } from "next-intl/server";
import { formatMoney } from "@/lib/currency";

export async function MonthSummary({
  income,
  expense,
  currency,
  locale,
}: {
  income: number;
  expense: number;
  currency: string;
  locale: string;
}) {
  const t = await getTranslations("dashboard.summary");
  const net = income - expense;

  return (
    <div className="mb-3 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-lg border border-border bg-surface/30 py-2">
        <div className="text-[11px] text-fg-muted">{t("income")}</div>
        <div className="text-sm font-medium text-success">+{formatMoney(income, currency, locale)}</div>
      </div>
      <div className="rounded-lg border border-border bg-surface/30 py-2">
        <div className="text-[11px] text-fg-muted">{t("expenses")}</div>
        <div className="text-sm font-medium text-fg">-{formatMoney(expense, currency, locale)}</div>
      </div>
      <div className="rounded-lg border border-border bg-surface/30 py-2">
        <div className="text-[11px] text-fg-muted">{t("net")}</div>
        <div className={`text-sm font-medium ${net >= 0 ? "text-success" : "text-danger"}`}>
          {net >= 0 ? "+" : "-"}
          {formatMoney(Math.abs(net), currency, locale)}
        </div>
      </div>
    </div>
  );
}
