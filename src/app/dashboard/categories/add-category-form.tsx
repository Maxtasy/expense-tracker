"use client";

import { useRef, useState, useTransition } from "react";
import { createCategory } from "./actions";

type TxType = "expense" | "income";

export function AddCategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<TxType>("expense");
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createCategory(null, formData);
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
    <form ref={formRef} action={handleSubmit} className="mb-4 space-y-2">
      <div className="flex items-center gap-2">
        <input
          name="name"
          type="text"
          placeholder="New category name"
          required
          maxLength={50}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-60"
        >
          {isPending ? "..." : "Add"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-center text-xs font-medium transition ${
            type === "expense" ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface text-fg-muted"
          }`}
        >
          <input type="radio" name="type" value="expense" checked={type === "expense"} onChange={() => setType("expense")} className="sr-only" />
          Expense
        </label>
        <label
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-center text-xs font-medium transition ${
            type === "income" ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface text-fg-muted"
          }`}
        >
          <input type="radio" name="type" value="income" checked={type === "income"} onChange={() => setType("income")} className="sr-only" />
          Income
        </label>
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </form>
  );
}
