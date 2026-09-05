import { formatMoney } from "@/lib/currency";

export function MonthSummary({ income, expense, currency }: { income: number; expense: number; currency: string }) {
  const net = income - expense;

  return (
    <div className="mb-3 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-lg border border-border bg-surface/30 py-2">
        <div className="text-[11px] text-fg-muted">Income</div>
        <div className="text-sm font-medium text-success">+{formatMoney(income, currency)}</div>
      </div>
      <div className="rounded-lg border border-border bg-surface/30 py-2">
        <div className="text-[11px] text-fg-muted">Expenses</div>
        <div className="text-sm font-medium text-fg">-{formatMoney(expense, currency)}</div>
      </div>
      <div className="rounded-lg border border-border bg-surface/30 py-2">
        <div className="text-[11px] text-fg-muted">Net</div>
        <div className={`text-sm font-medium ${net >= 0 ? "text-success" : "text-danger"}`}>
          {net >= 0 ? "+" : "-"}
          {formatMoney(Math.abs(net), currency)}
        </div>
      </div>
    </div>
  );
}
