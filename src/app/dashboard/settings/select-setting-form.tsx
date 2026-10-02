"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/spinner";

type Result = { error?: string; success?: boolean } | undefined;

export function SelectSettingForm({
  action,
  name,
  value,
  options,
  ariaLabel,
}: {
  action: (formData: FormData) => Promise<Result>;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

  function handleChange(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      const result = await action(formData);
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
        key={value}
        name={name}
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        disabled={isPending}
        aria-label={ariaLabel}
        className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-fg focus:border-accent focus:outline-none disabled:opacity-60"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {isPending && <Spinner size={14} />}
      {saved && !isPending && <span className="shrink-0 text-xs text-success">{t("saved")}</span>}
      {error && <span className="shrink-0 text-xs text-danger">{error}</span>}
    </form>
  );
}
