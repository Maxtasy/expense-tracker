"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { importData } from "./actions";
import { Spinner } from "@/components/spinner";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg file:mr-2 file:rounded-md file:border-0 file:bg-accent file:px-2 file:py-1 file:text-xs file:font-medium file:text-accent-fg";

export function ImportForm() {
  const t = useTranslations("settings.csvImport");
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
        <label htmlFor="categoriesFile" className="mb-1 block text-xs text-fg-muted">
          {t("categoriesFileLabel")}
        </label>
        <input id="categoriesFile" name="categoriesFile" type="file" accept=".csv,text/csv" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="recurringFile" className="mb-1 block text-xs text-fg-muted">
          {t("recurringFileLabel")}
        </label>
        <input id="recurringFile" name="recurringFile" type="file" accept=".csv,text/csv" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="transactionsFile" className="mb-1 block text-xs text-fg-muted">
          {t("transactionsFileLabel")}
        </label>
        <input id="transactionsFile" name="transactionsFile" type="file" accept=".csv,text/csv" required className={inputClass} />
      </div>
      <label className="flex items-start gap-2 text-xs text-fg-muted">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5"
        />
        {t("confirmText")}
      </label>
      <button
        type="submit"
        disabled={!confirmed || isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-danger px-3 py-2 text-sm font-medium text-accent-fg transition disabled:opacity-40"
      >
        {isPending && <Spinner size={14} />}
        {isPending ? t("importing") : t("replaceMyData")}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-success">{t("importComplete")}</p>}
    </form>
  );
}
