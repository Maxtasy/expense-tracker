"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { upgradeGuestAccount } from "./actions";
import { Spinner } from "@/components/spinner";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none";

export function UpgradeGuestForm() {
  const t = useTranslations("settings.upgradeGuest");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  // No success state of its own: on success the action revalidates the layout, which swaps this
  // whole card (and the guest banner) out for the regular-account UI.
  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      const result = await upgradeGuestAccount(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-2">
      <div className="space-y-1">
        <label htmlFor="guestEmail" className="block text-xs text-fg-muted">
          {t("emailLabel")}
        </label>
        <input id="guestEmail" name="email" type="email" required autoComplete="email" className={inputClass} />
      </div>
      <div className="space-y-1">
        <label htmlFor="guestPassword" className="block text-xs text-fg-muted">
          {t("passwordLabel")}
        </label>
        <input
          id="guestPassword"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-60"
      >
        {isPending && <Spinner size={14} />}
        {isPending ? t("submitPending") : t("submit")}
      </button>
    </form>
  );
}
