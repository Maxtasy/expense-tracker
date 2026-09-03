"use client";

import { useRef, useState, useTransition } from "react";
import { createRecurring } from "./actions";

type TxType = "expense" | "income";
type Category = { id: string; name: string; type: TxType };

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none";

export function AddRecurringForm({ categories }: { categories: Category[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<TxType>("expense");
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const filteredCategories = categories.filter((c) => c.type === type);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createRecurring(null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        formRef.current?.reset();
        setType("expense");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="mb-4 space-y-2 rounded-xl border border-border bg-surface/50 p-3">
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
      <input name="description" type="text" placeholder="Description" className={inputClass} />
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="block text-[11px] text-fg-muted">Starts on</span>
          <input name="startDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
        </label>
        <label className="space-y-1">
          <span className="block text-[11px] text-fg-muted">Ends on (optional)</span>
          <input name="endDate" type="date" className={inputClass} />
        </label>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-60"
      >
        {isPending ? "Adding..." : "Add recurring"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
