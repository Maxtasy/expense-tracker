"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { resendVerificationEmail } from "@/app/verify-email/actions";
import { Spinner } from "@/components/spinner";

export function ResendButton({ email }: { email: string }) {
  const t = useTranslations("auth.verifyEmailRequired");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (sent) {
    return <p className="text-sm text-success">{t("resendSuccessMessage")}</p>;
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await resendVerificationEmail(email);
        setSent(true);
      })}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-60"
    >
      {isPending && <Spinner size={14} />}
      {t("resend")}
    </button>
  );
}
