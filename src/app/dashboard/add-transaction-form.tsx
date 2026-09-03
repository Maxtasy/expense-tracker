"use client";

import { useActionState, useState } from "react";
import { createTransaction } from "./actions";

type Category = { id: string; name: string; type: "expense" | "income" };
type TxType = "expense" | "income";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none";

export function AddTransactionForm({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(createTransaction, undefined);
  const [type, setType] = useState<TxType>("expense");
  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <form action={formAction} className="mb-4 space-y-2 rounded-xl border border-border bg-surface/50 p-3">
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
        <input name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required className={inputClass} />
        <select key={type} name="categoryId" defaultValue="" className={inputClass}>
          <option value="">Uncategorized</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
        <input name="description" type="text" placeholder="Description" className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add"}
      </button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
