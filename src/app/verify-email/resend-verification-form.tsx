"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { resendVerificationEmail } from "./actions";
import { Spinner } from "@/components/spinner";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none";

export function ResendVerificationForm() {
  const t = useTranslations("auth.verifyEmail");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (sent) {
    return <p className="text-sm text-success">{t("resendSuccessMessage")}</p>;
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const email = new FormData(e.currentTarget).get("email");
        if (typeof email !== "string") return;
        startTransition(async () => {
          await resendVerificationEmail(email);
          setSent(true);
        });
      }}
    >
      <input name="email" type="email" required autoComplete="email" placeholder={t("emailLabel")} className={inputClass} />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-60"
      >
        {isPending && <Spinner size={14} />}
        {isPending ? t("resendPending") : t("requestNewLink")}
      </button>
    </form>
  );
}
