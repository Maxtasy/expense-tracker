"use client";

import { useActionState } from "react";
import { createExpense } from "./actions";

type Category = { id: string; name: string };

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none";

export function AddExpenseForm({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(createExpense, undefined);

  return (
    <form action={formAction} className="mb-4 space-y-2 rounded-xl border border-border bg-surface/50 p-3">
      <div className="grid grid-cols-2 gap-2">
        <input name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required className={inputClass} />
        <select name="categoryId" defaultValue="" className={inputClass}>
          <option value="">Uncategorized</option>
          {categories.map((c) => (
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
        {pending ? "Adding..." : "Add expense"}
      </button>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
