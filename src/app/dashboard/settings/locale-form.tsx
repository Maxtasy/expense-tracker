"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateLocale } from "./actions";
import { LOCALES } from "@/lib/locale";

export function LocaleForm({ locale }: { locale: string }) {
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

  function handleChange(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      const result = await updateLocale(formData);
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
        key={locale}
        name="locale"
        defaultValue={locale}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        disabled={isPending}
        aria-label={t("languageAriaLabel")}
        className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-fg focus:border-accent focus:outline-none disabled:opacity-60"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
      {saved && !isPending && <span className="shrink-0 text-xs text-success">{t("saved")}</span>}
      {error && <span className="shrink-0 text-xs text-danger">{error}</span>}
    </form>
  );
}
