export type TxType = "expense" | "income";

// Visual language: income = blue (the app's existing accent color), expense = amber.
// Used by every expense/income toggle and type-aware submit button in the app.
export function typeChipClass(type: TxType, active: boolean): string {
  if (!active) return "border-border bg-surface text-fg-muted";
  return type === "expense" ? "border-expense bg-expense text-expense-fg" : "border-accent bg-accent text-accent-fg";
}

export function typeButtonClass(type: TxType): string {
  return type === "expense"
    ? "bg-expense text-expense-fg hover:bg-expense-hover"
    : "bg-accent text-accent-fg hover:bg-accent-hover";
}
