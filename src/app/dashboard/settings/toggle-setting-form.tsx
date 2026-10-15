"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/spinner";
import { Switch } from "@/components/switch";

type Result = { error?: string; success?: boolean } | undefined;

export function ToggleSettingForm({
  action,
  name,
  checked,
  ariaLabel,
}: {
  action: (formData: FormData) => Promise<Result>;
  name: string;
  checked: boolean;
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
    <form action={handleChange} className="flex items-center justify-end gap-2">
      <Switch
        key={String(checked)}
        name={name}
        defaultChecked={checked}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        disabled={isPending}
        ariaLabel={ariaLabel}
      />
      {isPending && <Spinner size={14} />}
      {saved && !isPending && <span role="status" className="shrink-0 text-xs text-success">{t("saved")}</span>}
      {error && <span role="alert" className="shrink-0 text-xs text-danger">{error}</span>}
    </form>
  );
}
