"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/spinner";

type Result = { error?: string; success?: boolean } | undefined;

export function ToggleSettingForm({
  action,
  name,
  checked,
  label,
  ariaLabel,
}: {
  action: (formData: FormData) => Promise<Result>;
  name: string;
  checked: boolean;
  label: string;
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
      <label className="flex flex-1 cursor-pointer items-start gap-2 text-xs text-fg-muted">
        <input
          key={String(checked)}
          type="checkbox"
          name={name}
          defaultChecked={checked}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          disabled={isPending}
          aria-label={ariaLabel}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
        />
        <span>{label}</span>
      </label>
      {isPending && <Spinner size={14} />}
      {saved && !isPending && <span className="shrink-0 text-xs text-success">{t("saved")}</span>}
      {error && <span className="shrink-0 text-xs text-danger">{error}</span>}
    </form>
  );
}
