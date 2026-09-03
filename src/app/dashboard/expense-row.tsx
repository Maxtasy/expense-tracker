"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { updateExpense, deleteExpense } from "./actions";
import { categoryColor } from "@/lib/category-color";

type Category = { id: string; name: string };
type Expense = {
  id: string;
  amount: string;
  date: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-fg focus:border-accent focus:outline-none";

export function ExpenseRow({ expense, categories }: { expense: Expense; categories: Category[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateExpense(null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setIsEditing(false);
      }
    });
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3 border-b border-border/60 px-1 py-2.5 last:border-b-0">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: categoryColor(expense.categoryName) }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-fg">{expense.description || expense.categoryName || "Expense"}</p>
          <p className="text-xs text-fg-muted">
            {expense.categoryName ?? "Uncategorized"} &middot; {expense.date}
          </p>
        </div>
        <span className="shrink-0 text-sm font-medium text-fg">{expense.amount}</span>
        <div className="flex shrink-0 items-center gap-2 text-fg-muted">
          <button type="button" onClick={() => setIsEditing(true)} aria-label="Edit" className="hover:text-fg">
            <Pencil size={15} />
          </button>
          <form action={deleteExpense} className="contents">
            <input type="hidden" name="id" value={expense.id} />
            <button type="submit" aria-label="Delete" className="hover:text-danger">
              <Trash2 size={15} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border/60 py-2.5 last:border-b-0">
      <form action={handleSubmit} className="space-y-2">
        <input type="hidden" name="id" value={expense.id} />
        <div className="grid grid-cols-2 gap-2">
          <input name="amount" type="number" step="0.01" min="0.01" required defaultValue={expense.amount} className={inputClass} />
          <select name="categoryId" defaultValue={expense.categoryId ?? ""} className={inputClass}>
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input name="date" type="date" required defaultValue={expense.date} className={inputClass} />
          <input name="description" type="text" defaultValue={expense.description ?? ""} className={inputClass} />
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
