"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { login } from "./actions";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Spinner } from "@/components/spinner";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4">
      <LocaleSwitcher className="absolute right-4 top-4" />
      <div className="w-full max-w-xs">
        <h1 className="mb-4 text-lg font-semibold text-fg">{t("title")}</h1>
        <form action={formAction} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs text-fg-muted">
              {t("emailLabel")}
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="block text-xs text-fg-muted">
              {t("passwordLabel")}
            </label>
            <input id="password" name="password" type="password" required autoComplete="current-password" className={inputClass} />
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
        <p className="mt-4 text-sm text-fg-muted">
          {t("noAccount")}{" "}
          <Link href="/signup" className="text-accent hover:text-accent-hover">
            {t("signupLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
