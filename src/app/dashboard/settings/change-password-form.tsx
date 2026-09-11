"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { changePassword } from "./actions";
import { Spinner } from "@/components/spinner";

export function ChangePasswordForm() {
  const t = useTranslations("settings.changePassword");
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(undefined);
    setSuccess(false);
    startTransition(async () => {
      const result = await changePassword(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-2">
      <div className="space-y-1">
        <label htmlFor="currentPassword" className="block text-xs text-fg-muted">
          {t("currentPasswordLabel")}
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="newPassword" className="block text-xs text-fg-muted">
          {t("newPasswordLabel")}
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="block text-xs text-fg-muted">
          {t("confirmPasswordLabel")}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-success">{t("success")}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-60"
      >
        {isPending && <Spinner size={14} />}
        {isPending ? t("saving") : t("saveButton")}
      </button>
    </form>
  );
}
