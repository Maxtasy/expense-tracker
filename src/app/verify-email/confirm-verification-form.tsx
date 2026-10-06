"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/spinner";
import { ResendVerificationForm } from "./resend-verification-form";
import { confirmVerification } from "./actions";

// Shown when /verify-email is opened with a still-valid token: nothing is verified until the person
// presses the button, so a mail scanner that merely fetches the link can't use the token up.
export function ConfirmVerificationForm({ token }: { token: string }) {
  const t = useTranslations("auth.verifyEmail");
  const [result, setResult] = useState<"verified" | "failed" | null>(null);
  const [isPending, startTransition] = useTransition();

  if (result === "verified") {
    return (
      <>
        <h1 className="mb-2 text-lg font-semibold text-fg">{t("successTitle")}</h1>
        <p className="mb-4 text-sm text-fg-muted">{t("successDescription")}</p>
        <Link href="/dashboard" className="text-sm text-accent-text hover:text-accent-hover">
          {t("goToDashboard")}
        </Link>
      </>
    );
  }

  if (result === "failed") {
    return (
      <>
        <h1 className="mb-2 text-lg font-semibold text-fg">{t("invalidOrExpiredTitle")}</h1>
        <p className="mb-4 text-sm text-fg-muted">{t("invalidOrExpiredDescription")}</p>
        <ResendVerificationForm />
      </>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-lg font-semibold text-fg">{t("confirmTitle")}</h1>
      <p className="mb-4 text-sm text-fg-muted">{t("confirmDescription")}</p>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setResult((await confirmVerification(token)) ? "verified" : "failed");
          })
        }
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-60"
      >
        {isPending && <Spinner size={14} />}
        {isPending ? t("confirming") : t("confirmButton")}
      </button>
    </>
  );
}
