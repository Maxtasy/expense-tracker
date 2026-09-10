"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { resetTransactions } from "./actions";

export function ResetTransactionsForm() {
  const t = useTranslations("settings");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      const result = await resetTransactions();
      if (result?.error) {
        setError(result.error);
        setSuccess(false);
      } else {
        setError(undefined);
        setSuccess(true);
        setConfirmed(false);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-2">
      <label className="flex items-start gap-2 text-xs text-fg-muted">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5" />
        {t("resetTransactionsConfirmText")}
      </label>
      <button
        type="submit"
        disabled={!confirmed || isPending}
        className="w-full rounded-lg bg-danger px-3 py-2 text-sm font-medium text-accent-fg transition disabled:opacity-40"
      >
        {isPending ? t("resettingTransactions") : t("resetTransactionsButton")}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-success">{t("resetTransactionsComplete")}</p>}
    </form>
  );
}
