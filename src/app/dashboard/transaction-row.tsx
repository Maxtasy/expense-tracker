"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { updateTransaction, deleteTransaction } from "./actions";
import { categoryColor } from "@/lib/category-color";

type TxType = "expense" | "income";
type Category = { id: string; name: string; type: TxType };
type Transaction = {
  id: string;
  type: TxType;
  amount: string;
  date: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-fg focus:border-accent focus:outline-none";

export function TransactionRow({ transaction, categories }: { transaction: Transaction; categories: Category[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [type, setType] = useState<TxType>(transaction.type);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateTransaction(undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setIsEditing(false);
      }
    });
  }

  if (!isEditing) {
    const isIncome = transaction.type === "income";
    return (
      <div className="flex items-center gap-3 border-b border-border/60 px-1 py-2.5 last:border-b-0">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: categoryColor(transaction.categoryName) }}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-fg">{transaction.description || transaction.categoryName || "Transaction"}</p>
          <p className="text-xs text-fg-muted">
            {transaction.categoryName ?? "Uncategorized"} &middot; {transaction.date}
          </p>
        </div>
        <span className={`shrink-0 text-sm font-medium ${isIncome ? "text-success" : "text-fg"}`}>
          {isIncome ? "+" : "-"}
          {transaction.amount}
        </span>
        <div className="flex shrink-0 items-center gap-2 text-fg-muted">
          <button type="button" onClick={() => setIsEditing(true)} aria-label="Edit" className="hover:text-fg">
            <Pencil size={15} />
          </button>
          <form action={deleteTransaction} className="contents">
            <input type="hidden" name="id" value={transaction.id} />
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
        <input type="hidden" name="id" value={transaction.id} />
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
          <input name="amount" type="number" step="0.01" min="0.01" required defaultValue={transaction.amount} className={inputClass} />
          <select
            key={type}
            name="categoryId"
            defaultValue={transaction.type === type ? (transaction.categoryId ?? "") : ""}
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
        <div className="grid grid-cols-2 gap-2">
          <input name="date" type="date" required defaultValue={transaction.date} className={inputClass} />
          <input name="description" type="text" defaultValue={transaction.description ?? ""} className={inputClass} />
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
