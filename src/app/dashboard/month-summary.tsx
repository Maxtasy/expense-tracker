export function MonthSummary({ income, expense }: { income: number; expense: number }) {
  const net = income - expense;

  return (
    <div className="mb-3 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-lg border border-border bg-surface/30 py-2">
        <div className="text-[11px] text-fg-muted">Income</div>
        <div className="text-sm font-medium text-success">+{income.toFixed(2)}</div>
      </div>
      <div className="rounded-lg border border-border bg-surface/30 py-2">
        <div className="text-[11px] text-fg-muted">Expenses</div>
        <div className="text-sm font-medium text-fg">-{expense.toFixed(2)}</div>
      </div>
      <div className="rounded-lg border border-border bg-surface/30 py-2">
        <div className="text-[11px] text-fg-muted">Net</div>
        <div className={`text-sm font-medium ${net >= 0 ? "text-success" : "text-danger"}`}>
          {net >= 0 ? "+" : "-"}
          {Math.abs(net).toFixed(2)}
        </div>
      </div>
    </div>
  );
}
