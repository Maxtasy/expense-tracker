"use client";

import { useRef, useState, useTransition } from "react";
import { importData } from "./actions";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg file:mr-2 file:rounded-md file:border-0 file:bg-accent file:px-2 file:py-1 file:text-xs file:font-medium file:text-accent-fg";

export function ImportForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await importData(null, formData);
      if (result?.error) {
        setError(result.error);
        setSuccess(false);
      } else {
        setError(undefined);
        setSuccess(true);
        formRef.current?.reset();
        setConfirmed(false);
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2">
      <div>
        <label className="mb-1 block text-xs text-fg-muted">categories.csv</label>
        <input name="categoriesFile" type="file" accept=".csv,text/csv" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">recurring_transactions.csv</label>
        <input name="recurringFile" type="file" accept=".csv,text/csv" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-fg-muted">transactions.csv</label>
        <input name="transactionsFile" type="file" accept=".csv,text/csv" required className={inputClass} />
      </div>
      <label className="flex items-start gap-2 text-xs text-fg-muted">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5"
        />
        I understand this replaces all my existing categories, recurring transactions, and transactions.
      </label>
      <button
        type="submit"
        disabled={!confirmed || isPending}
        className="w-full rounded-lg bg-danger px-3 py-2 text-sm font-medium text-accent-fg transition disabled:opacity-40"
      >
        {isPending ? "Importing..." : "Replace my data"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-success">Import complete.</p>}
    </form>
  );
}
