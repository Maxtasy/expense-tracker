"use client";

import { useState, useTransition } from "react";
import { updateTransaction } from "./actions";
import { currencySymbol } from "@/lib/currency";
import { AmountInput } from "@/components/amount-input";

type TxType = "expense" | "income";
type Category = { id: string; name: string; type: TxType };
type Transaction = {
  id: string;
  type: TxType;
  amount: string;
  date: string;
  description: string | null;
  categoryId: string | null;
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none";

export function EditTransactionForm({
  transaction,
  categories,
  currency,
  onSuccess,
}: {
  transaction: Transaction;
  categories: Category[];
  currency: string;
  onSuccess?: () => void;
}) {
  const [type, setType] = useState<TxType>(transaction.type);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const filteredCategories = categories.filter((c) => c.type === type);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateTransaction(undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        onSuccess?.();
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-2">
      <input type="hidden" name="id" value={transaction.id} />
      <div className="grid grid-cols-2 gap-2">
        <label
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-center text-sm font-medium transition ${
            type === "expense" ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface text-fg-muted"
          }`}
        >
          <input type="radio" name="type" value="expense" checked={type === "expense"} onChange={() => setType("expense")} className="sr-only" />
          Expense
        </label>
        <label
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-center text-sm font-medium transition ${
            type === "income" ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface text-fg-muted"
          }`}
        >
          <input type="radio" name="type" value="income" checked={type === "income"} onChange={() => setType("income")} className="sr-only" />
          Income
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <AmountInput symbol={currencySymbol(currency)} required defaultValue={transaction.amount} />
        <select
          key={type}
          name="categoryId"
          defaultValue={transaction.type === type ? (transaction.categoryId ?? "") : ""}
          aria-label="Category"
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
        <input name="date" type="date" required aria-label="Date" defaultValue={transaction.date} className={inputClass} />
        <input name="description" type="text" aria-label="Description" defaultValue={transaction.description ?? ""} className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
