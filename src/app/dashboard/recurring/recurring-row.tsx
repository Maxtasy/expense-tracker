"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { updateRecurring, deleteRecurring } from "./actions";
import { categoryColor } from "@/lib/category-color";
import { currencySymbol, formatMoney } from "@/lib/currency";
import { AmountInput } from "@/components/amount-input";

type TxType = "expense" | "income";
type Category = { id: string; name: string; type: TxType };
type Recurring = {
  id: string;
  type: TxType;
  amount: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  startDate: string;
  endDate: string | null;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-fg focus:border-accent focus:outline-none";

export function RecurringRow({
  recurring,
  categories,
  currency,
}: {
  recurring: Recurring;
  categories: Category[];
  currency: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [type, setType] = useState<TxType>(recurring.type);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateRecurring(null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setIsEditing(false);
      }
    });
  }

  if (!isEditing) {
    const isIncome = recurring.type === "income";
    const day = recurring.startDate.split("-")[2];
    return (
      <div className="flex items-center gap-3 border-b border-border/60 px-1 py-2.5 last:border-b-0">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: categoryColor(recurring.categoryName) }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-fg">{recurring.description || recurring.categoryName || "Recurring"}</p>
          <p className="text-xs text-fg-muted">
            {recurring.categoryName ?? "Uncategorized"} &middot; Day {day} of month
            {recurring.endDate ? ` · until ${recurring.endDate}` : ""}
          </p>
        </div>
        <span className={`shrink-0 text-sm font-medium ${isIncome ? "text-success" : "text-fg"}`}>
          {isIncome ? "+" : "-"}
          {formatMoney(recurring.amount, currency)}
        </span>
        <div className="flex shrink-0 items-center gap-2 text-fg-muted">
          <button type="button" onClick={() => setIsEditing(true)} aria-label="Edit" className="hover:text-fg">
            <Pencil size={15} />
          </button>
          <form action={deleteRecurring} className="contents">
            <input type="hidden" name="id" value={recurring.id} />
            <button type="submit" aria-label="Delete" className="hover:text-danger">
              <Trash2 size={15} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <div className="border-b border-border/60 py-2.5 last:border-b-0">
      <form action={handleSubmit} className="space-y-2">
        <input type="hidden" name="id" value={recurring.id} />
        <div className="grid grid-cols-2 gap-2">
          <label
            className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-center text-xs font-medium transition ${
              type === "expense" ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface text-fg-muted"
            }`}
          >
            <input type="radio" name="type" value="expense" checked={type === "expense"} onChange={() => setType("expense")} className="sr-only" />
            Expense
          </label>
          <label
            className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-center text-xs font-medium transition ${
              type === "income" ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface text-fg-muted"
            }`}
          >
            <input type="radio" name="type" value="income" checked={type === "income"} onChange={() => setType("income")} className="sr-only" />
            Income
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <AmountInput symbol={currencySymbol(currency)} required defaultValue={recurring.amount} size="sm" />
          <select
            key={type}
            name="categoryId"
            defaultValue={recurring.type === type ? (recurring.categoryId ?? "") : ""}
            className={inputClass}
          >
            <option value="">Uncategorized</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <input name="description" type="text" defaultValue={recurring.description ?? ""} className={inputClass} />
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="block text-[11px] text-fg-muted">Starts on</span>
            <input name="startDate" type="date" required defaultValue={recurring.startDate} className={inputClass} />
          </label>
          <label className="space-y-1">
            <span className="block text-[11px] text-fg-muted">Ends on (optional)</span>
            <input name="endDate" type="date" defaultValue={recurring.endDate ?? ""} className={inputClass} />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-fg-muted hover:text-fg">
            Cancel
          </button>
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      </form>
    </div>
  );
}
