"use client";

import { useState, useTransition } from "react";
import { updateCurrency } from "./actions";
import { CURRENCIES } from "@/lib/currency";

export function CurrencyForm({ currency }: { currency: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

  function handleChange(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      const result = await updateCurrency(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setSaved(true);
      }
    });
  }

  return (
    <form action={handleChange} className="flex items-center gap-2">
      <select
        key={currency}
        name="currency"
        defaultValue={currency}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        disabled={isPending}
        aria-label="Currency"
        className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-fg focus:border-accent focus:outline-none disabled:opacity-60"
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} &middot; {c.name} ({c.symbol})
          </option>
        ))}
      </select>
      {saved && !isPending && <span className="shrink-0 text-xs text-success">Saved</span>}
      {error && <span className="shrink-0 text-xs text-danger">{error}</span>}
    </form>
  );
}
