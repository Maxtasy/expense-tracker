"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { resendVerificationEmail } from "@/app/verify-email/actions";
import { Spinner } from "@/components/spinner";

export function VerifyEmailBanner({ email }: { email: string }) {
  const t = useTranslations("dashboard.verifyEmailBanner");
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-muted">
      <span>{t("message", { email })}</span>
      {sent ? (
        <span className="text-success">{t("sent")}</span>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => {
            await resendVerificationEmail(email);
            setSent(true);
          })}
          className="inline-flex items-center gap-2 text-accent hover:text-accent-hover"
        >
          {isPending && <Spinner size={14} />}
          {t("resend")}
        </button>
      )}
    </div>
  );
}
