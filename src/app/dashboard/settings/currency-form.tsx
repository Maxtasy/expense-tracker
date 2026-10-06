"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateCurrency } from "./actions";
import { CURRENCIES, currencyName } from "@/lib/currency";

export function CurrencyForm({ currency, locale }: { currency: string; locale: string }) {
  const t = useTranslations("settings");
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
        aria-label={t("currencyAriaLabel")}
        className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-fg focus:border-accent focus:outline-none disabled:opacity-60"
      >
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} &middot; {currencyName(c.code, locale)} ({c.symbol})
          </option>
        ))}
      </select>
      {saved && !isPending && <span role="status" className="shrink-0 text-xs text-success">{t("saved")}</span>}
      {error && <span role="alert" className="shrink-0 text-xs text-danger">{error}</span>}
    </form>
  );
}
