"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { startGuestSession } from "./actions";
import { Spinner } from "@/components/spinner";

export function GuestStartForm() {
  const t = useTranslations("auth.guest");
  const [state, formAction, pending] = useActionState(startGuestSession, undefined);

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-fg hover:bg-accent-hover disabled:opacity-60"
      >
        {pending && <Spinner size={14} />}
        {pending ? t("starting") : t("start")}
      </button>
    </form>
  );
}
