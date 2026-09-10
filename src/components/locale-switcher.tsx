"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES } from "@/lib/locale";
import { setPreAuthLocale } from "./locale-switcher-actions";

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  function handleChange(formData: FormData) {
    startTransition(async () => {
      await setPreAuthLocale(formData);
    });
  }

  return (
    <form action={handleChange}>
      <select
        key={locale}
        name="locale"
        defaultValue={locale}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        disabled={isPending}
        aria-label={t("languageAriaLabel")}
        className={`rounded-lg border border-border bg-surface px-2 py-1 text-xs text-fg-muted focus:border-accent focus:outline-none disabled:opacity-60 ${className ?? ""}`}
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </form>
  );
}
