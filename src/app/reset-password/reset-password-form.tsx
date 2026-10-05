"use client";

import { AuthBrand } from "@/components/auth-brand";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { resetPassword } from "./actions";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Spinner } from "@/components/spinner";
import { PasswordInput } from "@/components/password-input";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none";

export function ResetPasswordForm({ token }: { token?: string }) {
  const t = useTranslations("auth.resetPassword");
  const [state, formAction, pending] = useActionState(resetPassword, undefined);
  // controlled so a failed attempt doesn't wipe the fields (React resets uncontrolled forms after an action)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (!token) {
    return (
      <main className="relative flex min-h-dvh flex-col items-center justify-center px-4">
        <LocaleSwitcher className="absolute right-4 top-4" />
        <div className="w-full max-w-xs text-center">
        <AuthBrand centered />
          <h1 className="mb-2 text-lg font-semibold text-fg">{t("invalidOrExpiredTitle")}</h1>
          <p className="mb-4 text-sm text-fg-muted">{t("invalidOrExpiredDescription")}</p>
          <Link href="/forgot-password" className="text-sm text-accent-text hover:text-accent-hover">
            {t("requestNewLink")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4">
      <LocaleSwitcher className="absolute right-4 top-4" />
      <div className="w-full max-w-xs">
        <AuthBrand />
        <h1 className="mb-4 text-lg font-semibold text-fg">{t("title")}</h1>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="token" value={token} />
          <div className="space-y-1">
            <label htmlFor="newPassword" className="block text-xs text-fg-muted">
              {t("newPasswordLabel")}
            </label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              name="newPassword"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-xs text-fg-muted">
              {t("confirmPasswordLabel")}
            </label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              name="confirmPassword"
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          {state?.error && <p className="text-sm text-danger">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-60"
          >
            {pending && <Spinner size={14} />}
            {pending ? t("submitPending") : t("submit")}
          </button>
        </form>
      </div>
    </main>
  );
}
